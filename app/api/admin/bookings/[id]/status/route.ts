// Updates a tenant's booking status through the shared booking service.
import { z } from "zod";
import { BookingError, recordBookingStatusChange } from "@/features/booking/server/service";
import { requireTenantRole } from "@/features/auth/guards";
import { apiError, apiSuccess } from "@/lib/api";

const statusSchema = z.object({ tenant: z.string().min(1), status: z.enum(["confirmed", "cancelled", "no_show"]), managerRemark: z.string().max(1000).optional().default("") });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Choose a valid booking status.", 400);
  const access = await requireTenantRole(parsed.data.tenant, ["owner", "manager", "staff_bookings"]);
  if (!access) return apiError("You do not have access to update this booking.", 403);
  try {
    const booking = await recordBookingStatusChange({ tenantId: access.tenantId, userId: access.userId, bookingId: id, status: parsed.data.status, managerRemark: parsed.data.managerRemark });
    return apiSuccess(booking);
  } catch (error) {
    if (error instanceof BookingError) return apiError(error.message, error.statusCode);
    return apiError("We could not update this booking. Please try again.", 500);
  }
}
