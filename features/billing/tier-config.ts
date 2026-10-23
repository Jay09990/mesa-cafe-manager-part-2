// Single source of truth for tier access and the trial's temporary feature unlocks.
export const TRIAL_DAYS = 30;

export type Tier = "basic" | "standard" | "premium" | "custom";
export type Feature = "menu" | "booking" | "salesLog" | "dashboard" | "analytics";

const PAID_TIER_FEATURES: Record<Tier, Record<Feature, boolean>> = {
  basic: { menu: true, booking: false, salesLog: false, dashboard: false, analytics: false },
  standard: { menu: true, booking: true, salesLog: false, dashboard: false, analytics: false },
  premium: { menu: true, booking: true, salesLog: false, dashboard: false, analytics: false },
  custom: { menu: true, booking: true, salesLog: false, dashboard: false, analytics: false },
};

const TRIAL_FEATURES: Record<Feature, boolean> = {
  menu: true,
  booking: true,
  salesLog: true,
  dashboard: true,
  analytics: false,
};

export function canUseFeature(
  tenant: { tier: string; subscriptionStatus: string },
  feature: Feature,
): boolean {
  if (tenant.subscriptionStatus === "trial") return TRIAL_FEATURES[feature];
  const tier = tenant.tier as Tier;
  return PAID_TIER_FEATURES[tier]?.[feature] ?? false;
}
