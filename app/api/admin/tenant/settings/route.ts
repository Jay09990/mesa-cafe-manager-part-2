// Updates owner-only booking preferences and contact details for one tenant.
import { z } from "zod";
import { requireTenantRole } from "@/features/auth/guards";
import { apiError, apiSuccess } from "@/lib/api";
import { isValidTimezone } from "@/lib/time";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

const schema = z.object({
  tenant: z.string().min(1),
  timezone: z.string().refine(isValidTimezone).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  autoConfirmBookings: z.boolean().optional(),
  slotIntervalMinutes: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]).optional(),
  businessInfo: z.object({ name: z.string().max(100).optional(), phone: z.string().max(40).optional(), address: z.string().max(300).optional(), city: z.string().max(120).nullable().optional(), mapUrl: z.string().url().max(2000).nullable().optional(), instagramUrl: z.string().url().max(2000).nullable().optional() }).partial().optional(),
  businessCategory: z.enum(["cafe", "qsr", "casual_dining", "cloud_kitchen"]).nullable().optional(),
  gstin: z.string().nullable().optional(),
  fssaiLicense: z.string().nullable().optional(),
}).refine((value) => Object.keys(value).some((key) => key !== "tenant"), { message: "Add at least one setting to update." });

export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Check the timezone, currency, booking settings, and contact details.", 400);
  const access = await requireTenantRole(parsed.data.tenant, ["owner"]);
  if (!access) return apiError("Only the café owner can change these settings.", 403);
  const { tenant: _slug, businessInfo, ...changes } = parsed.data;
  const existing = await prisma.tenant.findUnique({ where: { id: access.tenantId }, select: { businessInfo: true } });
  if (!existing) return apiError("Café not found.", 404);
  const mergedInfo = businessInfo ? { ...(existing.businessInfo as Record<string, unknown>), ...businessInfo } : undefined;
  const updated = await prisma.tenant.update({ where: { id: access.tenantId }, data: { ...changes, ...(mergedInfo ? { businessInfo: mergedInfo } : {}) }, select: { timezone: true, currency: true, autoConfirmBookings: true, slotIntervalMinutes: true, businessInfo: true } });
  revalidateTag(`tenant-public:${parsed.data.tenant}`, { expire: 0 });
  return apiSuccess(updated);
}
