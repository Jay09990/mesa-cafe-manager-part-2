// Publishes a booking's current status without exposing contact details.
import { getBookingById } from "@/features/booking/server/service";
import { apiError, apiSuccess } from "@/lib/api";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const booking = await getBookingById(id);
  if (!booking) return apiError("Booking not found.", 404);
  return apiSuccess({ id: booking.id, status: booking.status, date: booking.date, time: booking.time, endTime: booking.endTime, partySize: booking.partySize, tenantName: booking.tenant.name });
}
