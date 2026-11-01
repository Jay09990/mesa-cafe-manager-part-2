// Creates or updates one immutable-history daily sales record (correct by editing).
import { requireTenantRole } from "@/features/auth/guards";
import { canUseFeature } from "@/features/billing/tier-config";
import { isSalesDateAllowed, salesLogSchema, saveSalesLog } from "@/features/sales-log/service";
import { apiError, apiSuccess } from "@/lib/api";
import { isIsoDate } from "@/lib/time";
import { prisma } from "@/lib/prisma";
import { invalidateDashboardCache } from "@/features/dashboard/server/summary";

export async function PUT(request: Request, context: { params: Promise<{ date: string }> }) {
  const { date } = await context.params;
  if (!isIsoDate(date)) return apiError("Choose a valid sales date.", 400);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const slug = typeof body?.tenant === "string" ? body.tenant : "";
  const access = await requireTenantRole(slug, ["owner", "manager"]);
  if (!access) return apiError("You do not have access to save sales for this café.", 403);
  const tenant = await prisma.tenant.findUnique({ where: { id: access.tenantId }, select: { tier: true, subscriptionStatus: true, timezone: true } });
  if (!tenant || !canUseFeature(tenant, "salesLog")) return apiError("Sales log is not available for this café.", 403);
  if (!isSalesDateAllowed(date, tenant.timezone)) return apiError("Sales can only be entered for today or an earlier date.", 400);
  const parsed = salesLogSchema.safeParse(body);
  if (!parsed.success) return apiError("Enter a whole order count and non-negative amounts with up to two decimal places.", 400);
  const entry = await saveSalesLog({ tenantId: access.tenantId, userId: access.userId, date, values: parsed.data });
  invalidateDashboardCache(access.tenantId);
  return apiSuccess(entry);
}
