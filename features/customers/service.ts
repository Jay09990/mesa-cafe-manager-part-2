// Maintains phone-keyed customer summaries from booking activity.
import type { Prisma } from "@prisma/client";

export async function upsertFromBooking(
  tx: Prisma.TransactionClient,
  input: { tenantId: string; name: string; phone: string; email?: string | null; createdAt?: Date },
) {
  const lastBookingAt = input.createdAt ?? new Date();
  return tx.customer.upsert({
    where: { tenantId_phone: { tenantId: input.tenantId, phone: input.phone } },
    create: { tenantId: input.tenantId, name: input.name, phone: input.phone, email: input.email || null, firstSeenAt: lastBookingAt, lastBookingAt, bookingCount: 1 },
    update: { name: input.name, email: input.email || undefined, lastBookingAt, bookingCount: { increment: 1 } },
  });
}
