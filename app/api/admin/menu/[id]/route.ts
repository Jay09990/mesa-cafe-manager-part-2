// Updates or deletes a menu item only when it belongs to the authorized tenant.
import { z } from "zod";
import { requireTenantRole } from "@/features/auth/guards";
import { apiError, apiSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  tenant: z.string().min(1),
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().max(1000).nullable().optional(),
  price: z.number().finite().nonnegative().max(1_000_000).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  dietaryType: z.enum(["veg", "non_veg", "egg"]).optional(),
  imageUrl: z.string().url().max(2048).nullable().optional(),
  available: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(100_000).optional(),
  isFeatured: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Check the menu item details and try again.", 400);
  const { tenant: slug, ...changes } = parsed.data;
  const access = await requireTenantRole(slug, ["owner", "manager"]);
  if (!access) return apiError("You do not have access to this menu.", 403);
  const existing = await prisma.menuItem.findFirst({ where: { id, tenantId: access.tenantId }, select: { id: true, available: true } });
  if (!existing) return apiError("Menu item not found.", 404);
  const item = await prisma.menuItem.update({ where: { id: existing.id }, data: changes });
  const type = changes.available !== undefined && changes.available !== existing.available ? "menu_item_toggled" : "menu_item_edited";
  await prisma.usageEvent.create({ data: { tenantId: access.tenantId, userId: access.userId, type, meta: { action: changes.available === false ? "sold_out" : "updated" } } });
  return apiSuccess(item);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const slug = new URL(request.url).searchParams.get("tenant") ?? "";
  const access = await requireTenantRole(slug, ["owner", "manager"]);
  if (!access) return apiError("You do not have access to this menu.", 403);
  const deleted = await prisma.menuItem.deleteMany({ where: { id, tenantId: access.tenantId } });
  if (!deleted.count) return apiError("Menu item not found.", 404);
  await prisma.usageEvent.create({ data: { tenantId: access.tenantId, userId: access.userId, type: "menu_item_edited", meta: { action: "deleted" } } });
  return apiSuccess({ success: true });
}
