// Lists tenant-local sales entries for owner and manager staff.
import { requireTenantRole } from "@/features/auth/guards";
import { canUseFeature } from "@/features/billing/tier-config";
import { addDaysToDate, getLocalDate, isIsoDate } from "@/lib/time";
import { apiError, apiSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const access = await requireTenantRole(url.searchParams.get("tenant") ?? "", ["owner", "manager"]);
  if (!access) return apiError("You do not have access to sales for this café.", 403);
  const tenant = access.tenant;
  if (!tenant || !canUseFeature(tenant, "salesLog")) return apiError("Sales log is not available for this café.", 403);
  const today = getLocalDate(new Date(), tenant.timezone);
  const from = url.searchParams.get("from") ?? addDaysToDate(today, -29);
  const to = url.searchParams.get("to") ?? today;
  if (!isIsoDate(from) || !isIsoDate(to) || from > to || addDaysToDate(from, 365) < to) return apiError("Choose a valid date range of 366 days or less.", 400);
  const entries = await prisma.salesLog.findMany({ where: { tenantId: access.tenantId, date: { gte: from, lte: to } }, orderBy: { date: "desc" } });
  return apiSuccess({ entries });
}
