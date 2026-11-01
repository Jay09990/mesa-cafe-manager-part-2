// Returns the tenant-local Today dashboard KPIs.
import { requireTenantRole } from "@/features/auth/guards";
import { canUseFeature } from "@/features/billing/tier-config";
import { getTodaySummary } from "@/features/dashboard/server/summary";
import { apiError, apiSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { after } from "next/server";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("tenant") ?? "";
  const access = await requireTenantRole(slug, ["owner", "manager"]);
  if (!access) return apiError("You do not have access to this dashboard.", 403);
  const tenant = access.tenant;
  if (!tenant || !canUseFeature(tenant, "dashboard")) return apiError("The dashboard is not available for this café.", 403);
  const summary = await getTodaySummary(access.tenantId, tenant.timezone);
  after(async () => {
    try { await prisma.usageEvent.create({ data: { tenantId: access.tenantId, userId: access.userId, type: "dashboard_opened" } }); }
    catch (error) { console.error("Failed to record dashboard view", error); }
  });
  return apiSuccess(summary);
}
