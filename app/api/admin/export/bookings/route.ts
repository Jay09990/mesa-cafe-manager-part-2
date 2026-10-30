// Exports a tenant's bookings as UTF-8 CSV with BOM.
import { requireTenantRole } from "@/features/auth/guards";
import { toCsv } from "@/lib/csv";
import { addDaysToDate, getLocalDate, isIsoDate } from "@/lib/time";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const access = await requireTenantRole(url.searchParams.get("tenant") ?? "", ["owner", "manager"]);
  if (!access) return apiError("You do not have access to export bookings for this café.", 403);
  const tenant = await prisma.tenant.findUnique({ where: { id: access.tenantId }, select: { timezone: true } });
  if (!tenant) return apiError("Café not found.", 404);
  const today = getLocalDate(new Date(), tenant.timezone);
  const from = url.searchParams.get("from") ?? addDaysToDate(today, -29);
  const to = url.searchParams.get("to") ?? today;
  const status = url.searchParams.get("status");
  if (!isIsoDate(from) || !isIsoDate(to) || from > to || addDaysToDate(from, 365) < to) return apiError("Choose a valid date range of 366 days or less.", 400);
  const bookings = await prisma.booking.findMany({ where: { tenantId: access.tenantId, date: { gte: from, lte: to }, ...(status ? { status } : {}) }, orderBy: [{ date: "asc" }, { time: "asc" }] });
  await prisma.usageEvent.create({ data: { tenantId: access.tenantId, userId: access.userId, type: "report_exported", meta: { report: "bookings" } } });
  const csv = toCsv([["date", "time", "name", "phone", "email", "party size", "status", "source", "notes", "created at"], ...bookings.map((booking) => [booking.date, booking.time, booking.name, booking.phone, booking.email, booking.partySize, booking.status, booking.source, booking.notes, booking.createdAt.toISOString()])]);
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="mesa-bookings-${from}-${to}.csv"` } });
}
