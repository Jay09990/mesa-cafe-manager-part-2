// Protects the admin section and supplies tenant-scoped navigation.
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireTenantRole } from "@/features/auth/guards";
import { AdminShell } from "@/features/admin-panel/components/AdminShell";
import { prisma } from "@/lib/prisma";
import { SetupReminder } from "@/features/tenant/components/SetupReminder";

export const instant = false;

export default async function TenantAdminLayout({ children, params }: { children: ReactNode; params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const access = await requireTenantRole(tenant, ["owner", "manager", "staff_bookings"]);
  if (!access) redirect("/sign-in");
  const tenantData = await prisma.tenant.findUnique({ where: { id: access.tenantId }, select: { trialEndsAt: true, timezone: true, subscriptionStatus: true, businessInfo: true, openingHours: true, seatCapacity: true, maxPartySize: true } });
  if (!tenantData) redirect("/sign-in");
  const businessInfo = tenantData.businessInfo as { address?: unknown };
  const hours = tenantData.openingHours as { routine?: unknown[]; weeklyOverrides?: Record<string, { slots?: unknown[]; isClosed?: boolean }>; dateOverrides?: Array<{ slots?: unknown[]; isClosed?: boolean }> };
  const hasHours = Boolean(hours.routine?.length || Object.values(hours.weeklyOverrides ?? {}).some((day) => !day.isClosed && day.slots?.length) || hours.dateOverrides?.some((day) => !day.isClosed && day.slots?.length));
  const setupComplete = typeof businessInfo.address === "string" && Boolean(businessInfo.address.trim()) && hasHours && tenantData.seatCapacity > 0 && tenantData.maxPartySize > 0;
  return <AdminShell tenant={tenant} role={access.role} trial={{ trialEndsAt: tenantData.trialEndsAt, timezone: tenantData.timezone, status: tenantData.subscriptionStatus }}><SetupReminder tenant={tenant} show={!setupComplete} />{children}</AdminShell>;
}
