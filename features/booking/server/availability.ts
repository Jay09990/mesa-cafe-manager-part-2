// The single source of booking slots, including overrides and midnight-spanning hours.
import { addDaysToDate, getWeekday } from "@/lib/time";

export type TimeWindow = { startTime: string; endTime: string };
export type OpeningHours = {
  routine?: TimeWindow[];
  weeklyOverrides?: Record<string, { isClosed?: boolean; slots?: TimeWindow[] }>;
  dateOverrides?: Array<{ date: string; isClosed?: boolean; reason?: string; slots?: TimeWindow[] }>;
};
export type OccupyingBooking = { date: string; time: string; endTime: string; partySize: number };
export type AvailabilitySlot = { time: string; endTime: string; available: boolean; capacityRemaining: number };

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const MINUTES_PER_DAY = 24 * 60;

function minutesFromTime(value: string): number {
  if (!TIME_PATTERN.test(value)) throw new Error("Opening hours must use 24-hour HH:mm times.");
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(value: number): string {
  const normalized = ((value % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function resolveWindows(openingHours: OpeningHours, date: string) {
  const override = openingHours.dateOverrides?.find((entry) => entry.date === date);
  if (override) return { windows: override.isClosed ? [] : override.slots ?? [], closed: Boolean(override.isClosed), reason: override.reason ?? null };

  const weekday = openingHours.weeklyOverrides?.[getWeekday(date)];
  if (weekday) return { windows: weekday.isClosed ? [] : weekday.slots ?? [], closed: Boolean(weekday.isClosed), reason: null };

  const windows = openingHours.routine ?? [];
  return { windows, closed: windows.length === 0, reason: null };
}

function asAbsoluteMinutes(time: string, endTime: string): [number, number] {
  const start = minutesFromTime(time);
  const end = minutesFromTime(endTime);
  return [start, end <= start ? end + MINUTES_PER_DAY : end];
}

function dayIndex(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

export function generateAvailability(input: {
  date: string;
  openingHours: OpeningHours;
  slotIntervalMinutes: number;
  seatCapacity: number;
  partySize?: number;
  bookings?: OccupyingBooking[];
}) {
  const resolution = resolveWindows(input.openingHours, input.date);
  if (resolution.closed) return { date: input.date, closed: true, closedReason: resolution.reason, slots: [] as AvailabilitySlot[] };
  if (![15, 30, 45, 60].includes(input.slotIntervalMinutes)) throw new Error("Slot interval must be 15, 30, 45, or 60 minutes.");

  const targetDay = dayIndex(input.date);
  const slots: AvailabilitySlot[] = [];
  for (const window of resolution.windows) {
    const startMinute = minutesFromTime(window.startTime);
    let endMinute = minutesFromTime(window.endTime);
    if (endMinute <= startMinute) endMinute += MINUTES_PER_DAY;

    for (let start = startMinute; start + input.slotIntervalMinutes <= endMinute; start += input.slotIntervalMinutes) {
      const end = start + input.slotIntervalMinutes;
      const occupiedSeats = (input.bookings ?? []).reduce((total, booking) => {
        const bookingDay = dayIndex(booking.date);
        const dayOffset = bookingDay - targetDay;
        const [bookingStart, bookingEnd] = asAbsoluteMinutes(booking.time, booking.endTime);
        const absoluteStart = bookingStart + dayOffset * MINUTES_PER_DAY;
        const absoluteEnd = bookingEnd + dayOffset * MINUTES_PER_DAY;
        return start < absoluteEnd && absoluteStart < end ? total + booking.partySize : total;
      }, 0);
      const capacityRemaining = Math.max(0, input.seatCapacity - occupiedSeats);
      slots.push({ time: timeFromMinutes(start), endTime: timeFromMinutes(end), capacityRemaining, available: input.partySize === undefined ? capacityRemaining > 0 : capacityRemaining >= input.partySize });
    }
  }

  return { date: input.date, closed: false, closedReason: null, slots };
}

export function getBookingDateRange(date: string) {
  return [addDaysToDate(date, -1), date] as const;
}
