// Renders the public booking flow for a tenant slug.
import { notFound } from "next/navigation";
import { PublicBookingForm } from "@/features/booking/components/PublicBookingForm";
import { getTenantBySlug } from "@/features/tenant/resolveTenant";

export default async function PublicBookPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  return <main className="min-h-screen bg-[var(--public-background)] px-4 py-10"><PublicBookingForm tenant={tenant.slug} cafeName={tenant.name} /></main>;
}
