// Sales log entry and history page.
import { notFound } from "next/navigation";
import { SalesLogManager } from "@/features/sales-log/components/SalesLogManager";
import { canUseFeature } from "@/features/billing/tier-config";
import { requireTenantRole } from "@/features/auth/guards";
import { getLocalDate } from "@/lib/time";

export default async function SalesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const access = await requireTenantRole(slug, ["owner", "manager"]);
  if (!access) notFound();
  const tenant = access.tenant;
  if (!canUseFeature(tenant, "salesLog")) notFound();
  return <><h1 className="mb-2 text-xl font-semibold">Sales</h1><SalesLogManager tenant={slug} today={getLocalDate(new Date(), tenant.timezone)} /></>;
}
