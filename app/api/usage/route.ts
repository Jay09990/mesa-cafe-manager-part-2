// Accepts anonymous public usage events without storing personal data.
import { z } from "zod";
import { trackEvent } from "@/features/usage/service";
import { getTenantForRequest } from "@/features/tenant/resolveTenant";
import { apiError, apiSuccess } from "@/lib/api";

const usageSchema = z.object({ event: z.enum(["menu_view", "book_click", "booking_started"]) });

export async function POST(request: Request) {
  const tenant = await getTenantForRequest(request);
  if (!tenant) return apiError("Café not found.", 404);
  const parsed = usageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("This activity could not be recorded.", 400);
  await trackEvent({ tenantId: tenant.id, type: parsed.data.event });
  return apiSuccess({ recorded: true }, 201);
}
