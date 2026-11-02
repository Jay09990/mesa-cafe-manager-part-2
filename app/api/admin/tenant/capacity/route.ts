// Updates owner-only seat capacity settings.
import { z } from "zod";
import { requireTenantRole } from "@/features/auth/guards";
import { apiError, apiSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const schema = z.object({ tenant: z.string().min(1), seatCapacity: z.number().int().min(1).max(1000), maxPartySize: z.number().int().min(1).max(1000) }).refine((value) => value.maxPartySize <= value.seatCapacity);
export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Maximum party size must be between 1 and the seat capacity.", 400);
  const access = await requireTenantRole(parsed.data.tenant, ["owner"]);
  if (!access) return apiError("Only the café owner can change capacity.", 403);
  const updated = await prisma.tenant.update({ where: { id: access.tenantId }, data: { seatCapacity: parsed.data.seatCapacity, maxPartySize: parsed.data.maxPartySize }, select: { seatCapacity: true, maxPartySize: true } });
  return apiSuccess(updated);
}
