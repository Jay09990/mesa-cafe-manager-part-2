// Centralizes authenticated tenant membership and fixed trial-role authorization.
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type MesaRole = "owner" | "manager" | "staff_bookings" | "staff_orders";

const ROLE_ACCESS: Record<string, MesaRole[]> = {
  owner: ["owner", "manager", "staff_bookings", "staff_orders"],
  manager: ["manager", "staff_bookings"],
  staff_bookings: ["staff_bookings"],
};

export async function requireTenantRole(slug: string, allowedRoles: MesaRole[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const staff = await prisma.staffMember.findFirst({
    where: { userId: session.user.id, tenant: { slug } },
    select: { id: true, role: true, tenant: { select: { id: true } } },
  });
  if (!staff || !allowedRoles.includes(staff.role as MesaRole)) return null;
  return { userId: session.user.id, tenantId: staff.tenant.id, role: staff.role as MesaRole };
}

export function canAccessRole(role: string, capability: "bookings" | "customers" | "menu" | "sales" | "settings" | "billing"): boolean {
  const access: Record<typeof capability, MesaRole[]> = {
    bookings: ["owner", "manager", "staff_bookings"],
    customers: ["owner", "manager", "staff_bookings"],
    menu: ["owner", "manager"],
    sales: ["owner", "manager"],
    settings: ["owner"],
    billing: ["owner"],
  };
  return access[capability].includes(role as MesaRole);
}

export const roleHierarchy = ROLE_ACCESS;
