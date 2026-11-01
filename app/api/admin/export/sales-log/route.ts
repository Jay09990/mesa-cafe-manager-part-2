// Exports a tenant's sales history as UTF-8 CSV with BOM.
import { requireTenantRole } from "@/features/auth/guards";
import { canUseFeature } from "@/features/billing/tier-config";
import { toCsv } from "@/lib/csv";
import { addDaysToDate, getLocalDate, isIsoDate } from "@/lib/time";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { after } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const access = await requireTenantRole(url.searchParams.get("tenant") ?? "", ["owner", "manager"]);
  if (!access) return apiError("You do not have access to export sales for this café.", 403);
  const tenant = access.tenant;
  if (!tenant || !canUseFeature(tenant, "salesLog")) return apiError("Sales log is not available for this café.", 403);
  const today = getLocalDate(new Date(), tenant.timezone);
  const from = url.searchParams.get("from") ?? addDaysToDate(today, -29);
  const to = url.searchParams.get("to") ?? today;
  if (!isIsoDate(from) || !isIsoDate(to) || from > to || addDaysToDate(from, 365) < to) return apiError("Choose a valid date range of 366 days or less.", 400);
  const entries = await prisma.salesLog.findMany({ where: { tenantId: access.tenantId, date: { gte: from, lte: to } }, orderBy: { date: "asc" } });
  after(async () => {
    try { await prisma.usageEvent.create({ data: { tenantId: access.tenantId, userId: access.userId, type: "report_exported", meta: { report: "sales_log" } } }); }
    catch (error) { console.error("Failed to record sales report export", error); }
  });
  const csv = toCsv([["date", "orders", "cash", "upi", "card", "other", "total", "notes"], ...entries.map((entry) => [entry.date, entry.ordersCount, Number(entry.cash), Number(entry.upi), Number(entry.card), Number(entry.other), Number(entry.totalSales), entry.notes])]);
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="mesa-sales-${from}-${to}.csv"` } });
}
