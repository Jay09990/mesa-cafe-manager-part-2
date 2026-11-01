// Centralizes authenticated tenant membership and fixed trial-role authorization.
import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTransientDatabaseFailure } from "@/features/auth/database-errors";

export type MesaRole = "owner" | "manager" | "staff_bookings" | "staff_orders";

const ROLE_ACCESS: Record<string, MesaRole[]> = {
  owner: ["owner", "manager", "staff_bookings", "staff_orders"],
  manager: ["manager", "staff_bookings"],
  staff_bookings: ["staff_bookings"],
};

// React request caching shares the same session and tenant membership between
// the admin layout and the nested page during a single server render.
async function readWithTransientRetry<T>(read: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await read();
    } catch (error) {
      if (!isTransientDatabaseFailure(error) || attempt >= 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 250 : 700));
    }
  }
}

const getRequestSession = cache(async () => readWithTransientRetry(async () => auth.api.getSession({ headers: await headers() })));

const getStaffMembership = cache(async (userId: string, slug: string) => readWithTransientRetry(() => prisma.staffMember.findFirst({
  where: { userId, tenant: { slug } },
  select: {
    id: true,
    role: true,
    tenant: { select: {
      id: true,
      name: true,
      trialEndsAt: true,
      timezone: true,
      subscriptionStatus: true,
      businessInfo: true,
      openingHours: true,
      seatCapacity: true,
      maxPartySize: true,
      tier: true,
      currency: true,
    } },
  },
})));

export async function requireTenantRole(slug: string, allowedRoles: MesaRole[]) {
  const startedAt = performance.now();
  let sessionMs = 0;
  let membershipMs = 0;
  try {
    const sessionStartedAt = performance.now();
    const session = await getRequestSession();
    sessionMs = performance.now() - sessionStartedAt;
    if (!session) return null;

    const membershipStartedAt = performance.now();
    const staff = await getStaffMembership(session.user.id, slug);
    membershipMs = performance.now() - membershipStartedAt;
    if (!staff || !allowedRoles.includes(staff.role as MesaRole)) return null;
    return { userId: session.user.id, tenantId: staff.tenant.id, role: staff.role as MesaRole, tenant: staff.tenant };
  } finally {
    if (process.env.MESA_PERF_LOGS === "1") {
      console.info("[perf] tenant authorization", { sessionMs: Math.round(sessionMs), membershipMs: Math.round(membershipMs), totalMs: Math.round(performance.now() - startedAt) });
    }
  }
}

export function canAccessRole(role: string, capability: "bookings" | "customers" | "menu" | "sales" | "dashboard" | "settings" | "billing"): boolean {
  const access: Record<typeof capability, MesaRole[]> = {
    bookings: ["owner", "manager", "staff_bookings"],
    customers: ["owner", "manager", "staff_bookings"],
    menu: ["owner", "manager"],
    sales: ["owner", "manager"],
    dashboard: ["owner", "manager"],
    settings: ["owner"],
    billing: ["owner"],
  };
  return access[capability].includes(role as MesaRole);
}

export const roleHierarchy = ROLE_ACCESS;
