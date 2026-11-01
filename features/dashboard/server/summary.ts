// Builds tenant-local Today and trend summaries for the admin dashboard.
import { addDaysToDate, getLocalDate } from "@/lib/time";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";

function percent(value: number, comparison: number | null | undefined): number | null {
  if (comparison === null || comparison === undefined) return null;
  if (comparison === 0) return value === 0 ? 0 : null;
  return Math.round(((value - comparison) / comparison) * 1000) / 10;
}

export async function getTodaySummary(tenantId: string, timezone: string, now = new Date()) {
  const date = getLocalDate(now, timezone);
  return getCachedTodaySummary(tenantId, timezone, date);
}

async function getCachedTodaySummary(tenantId: string, timezone: string, date: string) {
  "use cache";
  cacheLife({ stale: 15, revalidate: 15, expire: 60 });
  cacheTag(`tenant-dashboard:${tenantId}`);
  const yesterday = addDaysToDate(date, -1);
  const lastWeek = addDaysToDate(date, -7);
  const [entries, bookingRows] = await Promise.all([
    prisma.salesLog.findMany({ where: { tenantId, date: { in: [date, yesterday, lastWeek] } } }),
    prisma.booking.groupBy({
      by: ["date"],
      where: { tenantId, date: { in: [date, yesterday, lastWeek] }, status: { in: ["pending", "confirmed"] } },
      _count: { _all: true },
      _sum: { partySize: true },
    }),
  ]);
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));
  const current = byDate.get(date);
  const previous = byDate.get(yesterday);
  const week = byDate.get(lastWeek);
  const sales = Number(current?.totalSales ?? 0);
  const orders = current?.ordersCount ?? 0;
  const bookingStats = new Map<string, { count: number; covers: number }>();
  for (const booking of bookingRows) bookingStats.set(booking.date, { count: booking._count._all, covers: booking._sum.partySize ?? 0 });
  const currentBookings = bookingStats.get(date) ?? { count: 0, covers: 0 };
  const compare = (selector: (entry: (typeof entries)[number] | undefined) => number | null) => {
    const value = selector(current);
    return {
      value,
      vsYesterdayPct: value === null || !previous ? null : percent(value, selector(previous)),
      vsLastWeekPct: value === null || !week ? null : percent(value, selector(week)),
    };
  };
  return {
    date,
    salesLogged: Boolean(current),
    sales: compare((entry) => entry ? Number(entry.totalSales) : 0),
    orders: compare((entry) => entry?.ordersCount ?? 0),
    avgOrderValue: compare((entry) => entry && entry.ordersCount > 0 ? Number(entry.totalSales) / entry.ordersCount : null),
    bookings: { count: currentBookings.count, covers: currentBookings.covers, vsYesterdayPct: percent(currentBookings.count, bookingStats.get(yesterday)?.count), vsLastWeekPct: percent(currentBookings.count, bookingStats.get(lastWeek)?.count) },
  };
}

export async function getDashboardTrends(tenantId: string, range: 7 | 30, timezone: string, now = new Date()) {
  const today = getLocalDate(now, timezone);
  return getCachedDashboardTrends(tenantId, range, timezone, today);
}

async function getCachedDashboardTrends(tenantId: string, range: 7 | 30, timezone: string, today: string) {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 120 });
  cacheTag(`tenant-dashboard:${tenantId}`);
  const start = addDaysToDate(today, -(range - 1));
  const [sales, bookings] = await Promise.all([
    prisma.salesLog.findMany({ where: { tenantId, date: { gte: start, lte: today } }, orderBy: { date: "asc" } }),
    prisma.booking.groupBy({
      by: ["date", "time"],
      where: { tenantId, date: { gte: start, lte: today }, status: { in: ["pending", "confirmed"] } },
      _count: { _all: true },
    }),
  ]);
  const salesByDate = new Map(sales.map((entry) => [entry.date, entry]));
  const bookingCount = new Map<string, number>();
  const hourCount = new Map<number, number>();
  for (const booking of bookings) {
    bookingCount.set(booking.date, (bookingCount.get(booking.date) ?? 0) + booking._count._all);
    const hour = Number(booking.time.slice(0, 2));
    hourCount.set(hour, (hourCount.get(hour) ?? 0) + booking._count._all);
  }
  const daily = Array.from({ length: range }, (_, index) => {
    const date = addDaysToDate(start, index);
    const entry = salesByDate.get(date);
    return { date, totalSales: Number(entry?.totalSales ?? 0), ordersCount: entry?.ordersCount ?? 0, bookings: bookingCount.get(date) ?? 0 };
  });
  return {
    range: `${range}d`, daily,
    paymentMix: sales.reduce((mix, entry) => ({ cash: mix.cash + Number(entry.cash), upi: mix.upi + Number(entry.upi), card: mix.card + Number(entry.card), other: mix.other + Number(entry.other) }), { cash: 0, upi: 0, card: 0, other: 0 }),
    bookingsByHour: [...hourCount.entries()].sort(([a], [b]) => a - b).map(([hour, count]) => ({ hour, count })),
  };
}

export function invalidateDashboardCache(tenantId: string) {
  revalidateTag(`tenant-dashboard:${tenantId}`, { expire: 0 });
}
