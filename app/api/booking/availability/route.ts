// Returns tenant-local booking slots from the shared availability generator.
import { generateAvailability, getBookingDateRange } from "@/features/booking/server/availability";
import { canUseFeature } from "@/features/billing/tier-config";
import { getTenantForRequest } from "@/features/tenant/resolveTenant";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api";
import { isIsoDate } from "@/lib/time";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";
  const partySizeValue = url.searchParams.get("partySize");
  const partySize = partySizeValue === null ? undefined : Number(partySizeValue);
  if (!isIsoDate(date) || (partySize !== undefined && (!Number.isInteger(partySize) || partySize < 1))) return apiError("Enter a valid date and party size.", 400);

  const tenant = await getTenantForRequest(request);
  if (!tenant) return apiError("Café not found.", 404);
  if (!canUseFeature(tenant, "booking")) return apiError("Bookings are not available for this café.", 403);
  const dates = getBookingDateRange(date);
  const bookings = await prisma.booking.findMany({
    where: { tenantId: tenant.id, date: { in: [...dates] }, status: { in: ["pending", "confirmed"] } },
    select: { date: true, time: true, endTime: true, partySize: true },
  });
  return apiSuccess(generateAvailability({ date, openingHours: tenant.openingHours as never, slotIntervalMinutes: tenant.slotIntervalMinutes, seatCapacity: tenant.seatCapacity, partySize, bookings }));
}
