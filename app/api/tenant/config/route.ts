// Provides public, tenant-scoped configuration for the café site.
import { getTenantForRequest } from "@/features/tenant/resolveTenant";
import { apiError, apiSuccess } from "@/lib/api";

export async function GET(request: Request) {
  const tenant = await getTenantForRequest(request);
  if (!tenant) return apiError("Café not found.", 404);
  return apiSuccess({
    id: tenant.id,
    name: tenant.name,
    tier: tenant.tier,
    theme: tenant.theme,
    businessInfo: tenant.businessInfo,
    businessCategory: tenant.businessCategory,
    openingHours: tenant.openingHours,
    timezone: tenant.timezone,
    currency: tenant.currency,
    autoConfirmBookings: tenant.autoConfirmBookings,
  });
}
