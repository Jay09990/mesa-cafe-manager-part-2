import test from "node:test";
import assert from "node:assert/strict";
import { generateAvailability } from "../features/booking/server/availability.ts";

test("generates slots through a midnight-crossing opening window", () => {
  const result = generateAvailability({
    date: "2026-10-24",
    openingHours: { routine: [{ startTime: "20:00", endTime: "02:00" }] },
    slotIntervalMinutes: 30,
    seatCapacity: 20,
  });
  assert.equal(result.slots.length, 12);
  assert.deepEqual(result.slots.at(-1), { time: "01:30", endTime: "02:00", available: true, capacityRemaining: 20 });
});

test("returns no slots for weekly and date-level closed days", () => {
  const weekly = generateAvailability({
    date: "2026-10-24",
    openingHours: { routine: [{ startTime: "09:00", endTime: "12:00" }], weeklyOverrides: { sat: { isClosed: true } } },
    slotIntervalMinutes: 30,
    seatCapacity: 20,
  });
  const dated = generateAvailability({
    date: "2026-10-24",
    openingHours: { routine: [{ startTime: "09:00", endTime: "12:00" }], dateOverrides: [{ date: "2026-10-24", isClosed: true, reason: "Holiday" }] },
    slotIntervalMinutes: 30,
    seatCapacity: 20,
  });
  assert.equal(weekly.closed, true);
  assert.equal(weekly.slots.length, 0);
  assert.equal(dated.closedReason, "Holiday");
  assert.equal(dated.slots.length, 0);
});

test("date overrides take precedence over weekly overrides and routine hours", () => {
  const result = generateAvailability({
    date: "2026-10-24",
    openingHours: {
      routine: [{ startTime: "09:00", endTime: "12:00" }],
      weeklyOverrides: { sat: { slots: [{ startTime: "13:00", endTime: "14:00" }] } },
      dateOverrides: [{ date: "2026-10-24", slots: [{ startTime: "16:00", endTime: "17:00" }] }],
    },
    slotIntervalMinutes: 30,
    seatCapacity: 20,
  });
  assert.equal(result.slots[0].time, "16:00");
});

test("counts seats held by an overnight booking from the previous date", () => {
  const result = generateAvailability({
    date: "2026-10-24",
    openingHours: { routine: [{ startTime: "00:00", endTime: "01:00" }] },
    slotIntervalMinutes: 30,
    seatCapacity: 8,
    partySize: 4,
    bookings: [{ date: "2026-10-23", time: "23:30", endTime: "00:30", partySize: 5 }],
  });
  assert.equal(result.slots[0].available, false);
  assert.equal(result.slots[0].capacityRemaining, 3);
  assert.equal(result.slots[1].capacityRemaining, 8);
});
