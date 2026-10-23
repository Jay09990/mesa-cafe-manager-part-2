// Tenant-local calendar helpers; business dates never depend on the host timezone.
const DATE_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(timezone: string): Intl.DateTimeFormat {
  let formatter = DATE_FORMATTER_CACHE.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    DATE_FORMATTER_CACHE.set(timezone, formatter);
  }
  return formatter;
}

export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function getLocalDate(date: Date, timezone: string): string {
  return getDateFormatter(timezone).format(date);
}

export function addDaysToDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return [shifted.getUTCFullYear(), String(shifted.getUTCMonth() + 1).padStart(2, "0"), String(shifted.getUTCDate()).padStart(2, "0")].join("-");
}

export function getWeekday(date: string): "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat" {
  const [year, month, day] = date.split("-").map(Number);
  return (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
