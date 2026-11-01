// Returns selected range sales and booking chart series.
import { requireTenantRole } from "@/features/auth/guards";
import { canUseFeature } from "@/features/billing/tier-config";
import { getDashboardTrends } from "@/features/dashboard/server/summary";
import { apiError, apiSuccess } from "@/lib/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("tenant") ?? "";
  const access = await requireTenantRole(slug, ["owner", "manager"]);
  if (!access) return apiError("You do not have access to this dashboard.", 403);
  const tenant = access.tenant;
  if (!tenant || !canUseFeature(tenant, "dashboard")) return apiError("The dashboard is not available for this café.", 403);
  const range = url.searchParams.get("range") === "30d" ? 30 : url.searchParams.get("range") === "7d" || !url.searchParams.has("range") ? 7 : null;
  if (!range) return apiError("Choose a 7-day or 30-day range.", 400);
  return apiSuccess(await getDashboardTrends(access.tenantId, range, tenant.timezone));
}
