// Trial dashboard page for owners and managers.
import { notFound } from "next/navigation";
import { TodayDashboard } from "@/features/dashboard/components/TodayDashboard";
import { canUseFeature } from "@/features/billing/tier-config";
import { requireTenantRole } from "@/features/auth/guards";

// Dashboard access depends on the current session and tenant data at request time.
export const instant = false;

export default async function DashboardPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const access = await requireTenantRole(slug, ["owner", "manager"]);
  if (!access) notFound();
  const tenant = access.tenant;
  if (!tenant || !canUseFeature(tenant, "dashboard")) notFound();
  return <TodayDashboard tenant={slug} currency={tenant.currency} />;
}
