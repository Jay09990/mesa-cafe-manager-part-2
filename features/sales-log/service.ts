// Validates and saves tenant-local daily sales entries.
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLocalDate } from "@/lib/time";

export const salesLogSchema = z.object({
  ordersCount: z.number().int().min(0).max(1_000_000),
  cash: z.number().finite().min(0).max(1_000_000_000).refine((value) => Number.isInteger(value * 100)),
  upi: z.number().finite().min(0).max(1_000_000_000).refine((value) => Number.isInteger(value * 100)),
  card: z.number().finite().min(0).max(1_000_000_000).refine((value) => Number.isInteger(value * 100)),
  other: z.number().finite().min(0).max(1_000_000_000).refine((value) => Number.isInteger(value * 100)),
  notes: z.string().max(1000).optional().default(""),
});

export type SalesLogInput = z.infer<typeof salesLogSchema>;

export function isSalesDateAllowed(date: string, timezone: string, now = new Date()) {
  return date <= getLocalDate(now, timezone);
}

export async function saveSalesLog(input: { tenantId: string; userId: string; date: string; values: SalesLogInput }) {
  const totalSales = input.values.cash + input.values.upi + input.values.card + input.values.other;
  const existing = await prisma.salesLog.findUnique({ where: { tenantId_date: { tenantId: input.tenantId, date: input.date } }, select: { id: true } });
  const entry = await prisma.salesLog.upsert({
    where: { tenantId_date: { tenantId: input.tenantId, date: input.date } },
    create: { tenantId: input.tenantId, date: input.date, ordersCount: input.values.ordersCount, cash: input.values.cash, upi: input.values.upi, card: input.values.card, other: input.values.other, totalSales, notes: input.values.notes || null, createdById: input.userId, updatedById: input.userId },
    update: { ordersCount: input.values.ordersCount, cash: input.values.cash, upi: input.values.upi, card: input.values.card, other: input.values.other, totalSales, notes: input.values.notes || null, updatedById: input.userId },
  });
  await prisma.usageEvent.create({ data: { tenantId: input.tenantId, userId: input.userId, type: "sales_log_saved" } });
  return { ...entry, created: !existing };
}
