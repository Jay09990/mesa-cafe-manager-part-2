// Lists and creates bookings for staff authorized on the requested tenant.
import { z } from "zod";
import { BookingError, createBooking } from "@/features/booking/server/service";
import { requireTenantRole } from "@/features/auth/guards";
import { getTenantBySlug } from "@/features/tenant/resolveTenant";
import { sendBookingEmail } from "@/lib/resend";
import { apiError, apiSuccess } from "@/lib/api";
import { isIsoDate } from "@/lib/time";
import { prisma } from "@/lib/prisma";

const ownerBookingSchema = z.object({
  tenant: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(7).max(30),
  email: z.union([z.string().email().max(254), z.literal(""), z.null()]).optional(),
  partySize: z.number().int().min(1).max(1000),
  date: z.string().refine(isIsoDate),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  notes: z.string().max(1000).optional().default(""),
  source: z.enum(["phone", "walk_in"]),
  sendConfirmation: z.boolean().default(false),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("tenant") ?? "";
  const access = await requireTenantRole(slug, ["owner", "manager", "staff_bookings"]);
  if (!access) return apiError("You do not have access to these bookings.", 403);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20) || 20));
  const status = url.searchParams.get("status");
  const date = url.searchParams.get("date");
  const source = url.searchParams.get("source");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const bookings = await prisma.booking.findMany({
    where: {
      tenantId: access.tenantId,
      ...(status ? { status } : {}),
      ...(date ? { date } : {}),
      ...(source ? { source } : {}),
      ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    skip: (page - 1) * limit,
    take: limit,
  });
  return apiSuccess({ bookings, page, limit });
}

export async function POST(request: Request) {
  const parsed = ownerBookingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Check the booking details and try again.", 400);
  const access = await requireTenantRole(parsed.data.tenant, ["owner", "manager", "staff_bookings"]);
  if (!access) return apiError("You do not have access to add bookings for this café.", 403);
  const tenant = await getTenantBySlug(parsed.data.tenant);
  if (!tenant || tenant.id !== access.tenantId) return apiError("Café not found.", 404);
  try {
    const result = await createBooking({ ...parsed.data, tenantId: access.tenantId, email: parsed.data.email || null, source: parsed.data.source });
    const emailSent = parsed.data.sendConfirmation && parsed.data.email
      ? await sendBookingEmail({ to: parsed.data.email, cafeName: tenant.name, date: parsed.data.date, time: parsed.data.time, status: "confirmed" })
      : false;
    return apiSuccess({ id: (result.created as { id: string }).id, status: result.status, confirmationSentTo: emailSent ? parsed.data.email : null }, 201);
  } catch (error) {
    if (error instanceof BookingError) return apiError(error.message, error.statusCode);
    return apiError("We could not create that booking. Please try again.", 500);
  }
}
