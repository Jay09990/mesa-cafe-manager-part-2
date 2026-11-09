// Sends the daily tenant-local sales summary or a short sales-entry nudge.
import { getTodaySummary } from "@/features/dashboard/server/summary";
import { sendDayEndEmail } from "@/lib/resend";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api";
import { isValidCronSecret } from "@/lib/cron-auth";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!isValidCronSecret(request.headers.get("authorization"), secret)) return apiError("Unauthorized.", 401);
  const tenants = await prisma.tenant.findMany({ where: { subscriptionStatus: { in: ["trial", "active"] } }, select: { id: true, name: true, timezone: true, currency: true, lastDayEndReportDate: true, staff: { where: { role: "owner" }, select: { user: { select: { email: true } } } } } });
  let sent = 0;
  for (const tenant of tenants) {
    const summary = await getTodaySummary(tenant.id, tenant.timezone);
    if (tenant.lastDayEndReportDate === summary.date) continue;
    const ownerEmail = tenant.staff[0]?.user.email;
    if (!ownerEmail) continue;
    const claim = await prisma.tenant.updateMany({ where: { id: tenant.id, OR: [{ lastDayEndReportDate: null }, { lastDayEndReportDate: { not: summary.date } }] }, data: { lastDayEndReportDate: summary.date } });
    if (claim.count === 0) continue;
    let delivered = false;
    try {
      delivered = await sendDayEndEmail({ to: ownerEmail, cafeName: tenant.name, date: summary.date, currency: tenant.currency, sales: summary.sales.value ?? 0, orders: summary.orders.value ?? 0, averageOrderValue: summary.avgOrderValue.value, bookings: summary.bookings.count, vsYesterdayPct: summary.sales.vsYesterdayPct, salesLogged: summary.salesLogged });
    } catch {
      delivered = false;
    }
    if (!delivered) {
      await prisma.tenant.updateMany({ where: { id: tenant.id, lastDayEndReportDate: summary.date }, data: { lastDayEndReportDate: tenant.lastDayEndReportDate } });
      continue;
    }
    await prisma.usageEvent.create({ data: { tenantId: tenant.id, type: "day_end_email_sent" } });
    sent += 1;
  }
  return apiSuccess({ sent });
}
