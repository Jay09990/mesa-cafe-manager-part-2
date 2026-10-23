// Protects the admin section and supplies tenant-scoped navigation.
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireTenantRole } from "@/features/auth/guards";
import { AdminShell } from "@/features/admin-panel/components/AdminShell";

export default async function TenantAdminLayout({ children, params }: { children: ReactNode; params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const access = await requireTenantRole(tenant, ["owner", "manager", "staff_bookings"]);
  if (!access) redirect("/sign-in");
  return <AdminShell tenant={tenant} role={access.role}>{children}</AdminShell>;
}
