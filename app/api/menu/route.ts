// Returns all public menu items, including sold-out items, in stable display order.
import { canUseFeature } from "@/features/billing/tier-config";
import { listPublicMenu } from "@/features/menu/service";
import { getTenantForRequest } from "@/features/tenant/resolveTenant";
import { apiError, apiSuccess } from "@/lib/api";

export async function GET(request: Request) {
  const tenant = await getTenantForRequest(request);
  if (!tenant) return apiError("Café not found.", 404);
  if (!canUseFeature(tenant, "menu")) return apiError("Menu is not available for this café.", 403);
  const items = await listPublicMenu(tenant.id);
  return apiSuccess(items.map(({ id, name, description, price, category, dietaryType, imageUrl, available, sortOrder, isFeatured }) => ({ id, name, description, price, category, dietaryType, imageUrl, available, sortOrder, isFeatured })));
}
