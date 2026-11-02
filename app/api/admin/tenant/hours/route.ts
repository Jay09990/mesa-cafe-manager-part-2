// Updates owner-only routine, weekly override and date override opening hours.
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireTenantRole } from "@/features/auth/guards";
import { apiError, apiSuccess } from "@/lib/api";
import { isIsoDate } from "@/lib/time";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const windowSchema = z.object({ startTime: time, endTime: time });
const hoursSchema = z.object({
  tenant: z.string().min(1),
  openingHours: z.object({
    routine: z.array(windowSchema).optional(),
    weeklyOverrides: z.record(z.string(), z.object({ isClosed: z.boolean().optional(), slots: z.array(windowSchema).optional() })).optional(),
    dateOverrides: z.array(z.object({ date: z.string().refine(isIsoDate), isClosed: z.boolean().optional(), reason: z.string().max(200).optional(), slots: z.array(windowSchema).optional() })).optional(),
  }),
});
export async function PATCH(request: Request) {
  const parsed = hoursSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Use valid 24-hour opening times and dates.", 400);
  const access = await requireTenantRole(parsed.data.tenant, ["owner"]);
  if (!access) return apiError("Only the café owner can change opening hours.", 403);
  const updated = await prisma.tenant.update({ where: { id: access.tenantId }, data: { openingHours: parsed.data.openingHours as Prisma.InputJsonValue }, select: { openingHours: true } });
  revalidateTag(`tenant-public:${parsed.data.tenant}`, { expire: 0 });
  return apiSuccess(updated);
}
