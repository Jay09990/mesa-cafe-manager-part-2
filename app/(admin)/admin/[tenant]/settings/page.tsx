// Owner settings for contact info, opening hours, and booking capacity.
import { notFound } from "next/navigation";
import { requireTenantRole } from "@/features/auth/guards";
import { TenantSettingsForm } from "@/features/tenant/components/TenantSettingsForm";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const access = await requireTenantRole(slug, ["owner"]);
  if (!access) notFound();
  const settings = await prisma.tenant.findUnique({ where: { id: access.tenantId }, select: { timezone: true, currency: true, autoConfirmBookings: true, slotIntervalMinutes: true, seatCapacity: true, maxPartySize: true, businessInfo: true, openingHours: true, businessCategory: true, gstin: true, fssaiLicense: true } });
  if (!settings) notFound();
  return <TenantSettingsForm tenant={slug} initial={{ ...settings, businessInfo: settings.businessInfo as Record<string, string | null>, openingHours: settings.openingHours as Record<string, unknown> }} />;
}
