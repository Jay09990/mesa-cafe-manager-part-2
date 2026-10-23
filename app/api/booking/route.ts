// Validates public booking submissions and returns safe, contact-free status data.
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createBooking, BookingError } from "@/features/booking/server/service";
import { getTenantForRequest } from "@/features/tenant/resolveTenant";
import { sendBookingEmail } from "@/lib/resend";
import { apiError, apiSuccess } from "@/lib/api";
import { isIsoDate } from "@/lib/time";

const bookingSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(7).max(30),
  email: z.union([z.string().email().max(254), z.literal(""), z.null()]).optional(),
  partySize: z.number().int().min(1).max(1000),
  date: z.string().refine(isIsoDate),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  notes: z.string().max(1000).optional().default(""),
  website: z.string().max(200).optional().default(""),
});

export async function POST(request: Request) {
  const tenant = await getTenantForRequest(request);
  if (!tenant) return apiError("Café not found.", 404);
  const parsed = bookingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Check the booking details and try again.", 400);
  if (parsed.data.website) return apiSuccess({ id: randomUUID(), status: "pending", confirmationSentTo: null }, 201);

  try {
    const result = await createBooking({
      tenantId: tenant.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      partySize: parsed.data.partySize,
      date: parsed.data.date,
      time: parsed.data.time,
      notes: parsed.data.notes,
      source: "online",
    });
    const emailSent = parsed.data.email ? await sendBookingEmail({ to: parsed.data.email, cafeName: tenant.name, date: parsed.data.date, time: parsed.data.time, status: result.status }) : false;
    const booking = result.created as { id: string };
    return apiSuccess({ id: booking.id, status: result.status, confirmationSentTo: emailSent ? parsed.data.email : null }, 201);
  } catch (error) {
    if (error instanceof BookingError) return apiError(error.message, error.statusCode);
    return apiError("We could not create that booking. Please try again.", 500);
  }
}
