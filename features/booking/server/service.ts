// Creates bookings only after a tenant-locked capacity check within one transaction.
import type { Prisma } from "@prisma/client";
import { upsertFromBooking } from "@/features/customers/service";
import { canUseFeature } from "@/features/billing/tier-config";
import { generateAvailability, getBookingDateRange } from "@/features/booking/server/availability";
import { prisma } from "@/lib/prisma";

export type BookingSource = "online" | "phone" | "walk_in";
export type BookingInput = { tenantId: string; name: string; phone: string; email?: string | null; partySize: number; date: string; time: string; notes?: string | null; source: BookingSource };

export class BookingError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

type CapacityOperations<Tenant, Booking, Created> = {
  lockTenant(): Promise<void>;
  unlockTenant?(): Promise<void>;
  getTenant(): Promise<Tenant | null>;
  listBookings(dates: readonly [string, string]): Promise<Booking[]>;
  countOnlineForPhone(phone: string, date: string): Promise<number>;
  createBooking(tenant: NonNullable<Tenant>, existing: Booking[], endTime: string): Promise<Created>;
};

export async function reserveBookingCapacity<Tenant extends {
  id: string; openingHours: unknown; slotIntervalMinutes: number; seatCapacity: number; maxPartySize: number; tier: string; subscriptionStatus: string; autoConfirmBookings: boolean;
}, Booking extends { date: string; time: string; endTime: string; partySize: number }, Created>(
  input: BookingInput,
  operations: CapacityOperations<Tenant | null, Booking, Created>,
): Promise<{ created: Created; status: "pending" | "confirmed"; endTime: string }> {
  await operations.lockTenant();
  try {
    const tenant = await operations.getTenant();
    if (!tenant || !canUseFeature(tenant, "booking")) throw new BookingError("Bookings are not available for this café.", 403);
    if (input.partySize < 1 || input.partySize > tenant.maxPartySize) throw new BookingError(`Party size must be between 1 and ${tenant.maxPartySize}.`, 400);

    if (input.source === "online" && await operations.countOnlineForPhone(input.phone, input.date) >= 3) {
      throw new BookingError("You have reached today's booking limit for this phone number. Please call the café.", 429);
    }

    const dates = getBookingDateRange(input.date);
    const existing = await operations.listBookings(dates);
    const availability = generateAvailability({
      date: input.date,
      openingHours: tenant.openingHours as never,
      slotIntervalMinutes: tenant.slotIntervalMinutes,
      seatCapacity: tenant.seatCapacity,
      partySize: input.partySize,
      bookings: existing,
    });
    const slot = availability.slots.find((candidate) => candidate.time === input.time);
    if (!slot || !slot.available) throw new BookingError("That time just filled up or is outside opening hours. Please pick another.", 409);

    const status = input.source === "online" && !tenant.autoConfirmBookings ? "pending" : "confirmed";
    const created = await operations.createBooking(tenant, existing, slot.endTime);
    return { created, status, endTime: slot.endTime };
  } finally {
    await operations.unlockTenant?.();
  }
}

async function createInsideTransaction(tx: Prisma.TransactionClient, input: BookingInput) {
  return reserveBookingCapacity(input, {
    lockTenant: async () => { await tx.$queryRaw`SELECT "id" FROM "Tenant" WHERE "id" = ${input.tenantId} FOR UPDATE`; },
    getTenant: () => tx.tenant.findUnique({ where: { id: input.tenantId } }),
    listBookings: (dates) => tx.booking.findMany({
      where: { tenantId: input.tenantId, date: { in: [...dates] }, status: { in: ["pending", "confirmed"] } },
      select: { date: true, time: true, endTime: true, partySize: true },
    }),
    countOnlineForPhone: async (phone, date) => tx.booking.count({ where: { tenantId: input.tenantId, phone, date, source: "online" } }),
    createBooking: async (tenant, _existing, endTime) => {
      const customer = await upsertFromBooking(tx, { tenantId: tenant.id, name: input.name, phone: input.phone, email: input.email });
      const booking = await tx.booking.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          name: input.name,
          phone: input.phone,
          email: input.email || null,
          partySize: input.partySize,
          date: input.date,
          time: input.time,
          endTime,
          notes: input.notes || null,
          source: input.source,
          status: input.source === "online" && !tenant.autoConfirmBookings ? "pending" : "confirmed",
        },
      });
      await tx.usageEvent.create({ data: { tenantId: tenant.id, type: "booking_created", meta: { source: input.source } } });
      return booking;
    },
  });
}

export async function createBooking(input: BookingInput) {
  try {
    return await prisma.$transaction((tx) => createInsideTransaction(tx, input), { isolationLevel: "ReadCommitted" });
  } catch (error) {
    if (error instanceof BookingError) throw error;
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") {
      throw new BookingError("That time just filled up. Please pick another.", 409);
    }
    throw error;
  }
}

export async function recordBookingStatusChange(input: { tenantId: string; userId: string; bookingId: string; status: "confirmed" | "cancelled" | "no_show"; managerRemark?: string }) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({ where: { id: input.bookingId, tenantId: input.tenantId } });
    if (!booking) throw new BookingError("Booking not found.", 404);
    const updated = await tx.booking.update({ where: { id: booking.id }, data: { status: input.status, managerRemark: input.managerRemark || null } });
    if (booking.customerId && input.status !== booking.status) {
      await tx.customer.update({ where: { id: booking.customerId }, data: { noShowCount: input.status === "no_show" ? { increment: 1 } : undefined } });
    }
    await tx.usageEvent.create({ data: { tenantId: input.tenantId, userId: input.userId, type: "booking_status_changed", meta: { status: input.status } } });
    return updated;
  });
}

export async function getBookingById(id: string) {
  return prisma.booking.findUnique({ where: { id }, select: { id: true, status: true, date: true, time: true, endTime: true, partySize: true, tenant: { select: { name: true, slug: true } } } });
}
