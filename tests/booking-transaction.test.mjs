import test from "node:test";
import assert from "node:assert/strict";
import { BookingError, reserveBookingCapacity } from "../features/booking/server/service.ts";

test("tenant capacity lock prevents two requests reserving the same seats", async () => {
  const tenant = {
    id: "tenant-1",
    openingHours: { routine: [{ startTime: "18:00", endTime: "19:00" }] },
    slotIntervalMinutes: 30,
    seatCapacity: 4,
    maxPartySize: 4,
    tier: "basic",
    subscriptionStatus: "trial",
    autoConfirmBookings: false,
  };
  const bookings = [];
  let tail = Promise.resolve();
  const input = (phone) => ({ tenantId: tenant.id, name: phone, phone, partySize: 3, date: "2026-10-24", time: "18:00", source: "online" });

  async function reserve(phone) {
    let release;
    return reserveBookingCapacity(input(phone), {
      lockTenant: async () => {
        const previous = tail;
        tail = new Promise((resolve) => { release = resolve; });
        await previous;
      },
      unlockTenant: async () => release(),
      getTenant: async () => tenant,
      listBookings: async () => bookings.map(({ date, time, endTime, partySize }) => ({ date, time, endTime, partySize })),
      countOnlineForPhone: async () => 0,
      createBooking: async (_tenant, _existing, endTime) => {
        const booking = { phone, date: "2026-10-24", time: "18:00", endTime, partySize: 3 };
        bookings.push(booking);
        return booking;
      },
    });
  }

  const results = await Promise.allSettled([reserve("11111111"), reserve("22222222")]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  const rejected = results.find((result) => result.status === "rejected");
  assert.ok(rejected.reason instanceof BookingError);
  assert.equal(rejected.reason.statusCode, 409);
  assert.equal(bookings.length, 1);
});
