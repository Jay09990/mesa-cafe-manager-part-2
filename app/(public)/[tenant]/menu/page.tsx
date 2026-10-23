// Resolves tenant menu content for public visitors and records menu views.
import { notFound } from "next/navigation";
import { listPublicMenu } from "@/features/menu/service";
import { MenuPublicView } from "@/features/menu/components/MenuPublicView";
import { UsagePing } from "@/features/usage/components/UsagePing";
import { getTenantBySlug } from "@/features/tenant/resolveTenant";

export default async function PublicMenuPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  const items = await listPublicMenu(tenant.id);
  return <main className="min-h-screen bg-[var(--public-background)] px-4 py-10"><div className="mx-auto max-w-5xl"><UsagePing tenant={tenant.slug} event="menu_view" /><a className="text-sm underline" href={`/${tenant.slug}`}>← {tenant.name}</a><h1 className="mb-8 mt-4 text-3xl font-semibold">Menu</h1><MenuPublicView items={items} currency={tenant.currency} /></div></main>;
}
