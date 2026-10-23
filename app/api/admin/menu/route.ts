// Lists and creates menu items for owners and managers on the resolved tenant.
import { z } from "zod";
import { requireTenantRole } from "@/features/auth/guards";
import { canUseFeature } from "@/features/billing/tier-config";
import { listMenuForAdmin } from "@/features/menu/service";
import { apiError, apiSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const menuItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(1000).optional().default(""),
  price: z.number().finite().nonnegative().max(1_000_000),
  category: z.string().trim().min(1).max(80),
  dietaryType: z.enum(["veg", "non_veg", "egg"]),
  imageUrl: z.union([z.string().url().max(2048), z.literal(""), z.null()]).optional(),
  available: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).max(100_000).optional().default(0),
  isFeatured: z.boolean().optional().default(false),
});

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("tenant") ?? "";
  const access = await requireTenantRole(slug, ["owner", "manager"]);
  if (!access) return apiError("You do not have access to this menu.", 403);
  return apiSuccess(await listMenuForAdmin(access.tenantId));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const slug = typeof body?.tenant === "string" ? body.tenant : "";
  const access = await requireTenantRole(slug, ["owner", "manager"]);
  if (!access) return apiError("You do not have access to this menu.", 403);
  const parsed = menuItemSchema.safeParse(body);
  if (!parsed.success) return apiError("Add a name, category, price, and dietary type to the menu item.", 400);
  const tenant = await prisma.tenant.findUnique({ where: { id: access.tenantId }, select: { tier: true, subscriptionStatus: true } });
  if (!tenant || !canUseFeature(tenant, "menu")) return apiError("Menu management is not available for this café.", 403);
  const item = await prisma.menuItem.create({ data: { ...parsed.data, tenantId: access.tenantId, description: parsed.data.description || null, imageUrl: parsed.data.imageUrl || null } });
  await prisma.usageEvent.create({ data: { tenantId: access.tenantId, userId: access.userId, type: "menu_item_edited", meta: { action: "created" } } });
  return apiSuccess(item, 201);
}
