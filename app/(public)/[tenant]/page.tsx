// Shows the single default themed café landing page and featured menu preview.
import { notFound } from "next/navigation";
import { listPublicMenu } from "@/features/menu/service";
import { MenuPublicView } from "@/features/menu/components/MenuPublicView";
import { getTenantBySlug } from "@/features/tenant/resolveTenant";
import { getLocalDate, getWeekday } from "@/lib/time";
import { TrackedLink } from "@/features/usage/components/TrackedLink";

type Hours = { routine?: Array<{ startTime: string; endTime: string }>; weeklyOverrides?: Record<string, { isClosed?: boolean; slots?: Array<{ startTime: string; endTime: string }> }>; dateOverrides?: Array<{ date: string; isClosed?: boolean; reason?: string; slots?: Array<{ startTime: string; endTime: string }> }> };
type BusinessInfo = { phone?: string; address?: string; mapUrl?: string | null; instagramUrl?: string | null };

function getTodayHours(hours: Hours, date: string) {
  const dated = hours.dateOverrides?.find((entry) => entry.date === date);
  if (dated) return { closed: Boolean(dated.isClosed), reason: dated.reason, slots: dated.slots ?? [] };
  const weekly = hours.weeklyOverrides?.[getWeekday(date)];
  if (weekly) return { closed: Boolean(weekly.isClosed), reason: undefined, slots: weekly.slots ?? [] };
  const slots = hours.routine ?? [];
  return { closed: slots.length === 0, reason: undefined, slots };
}

export default async function TenantLandingPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  const items = await listPublicMenu(tenant.id);
  const hours = getTodayHours(tenant.openingHours as Hours, getLocalDate(new Date(), tenant.timezone));
  const business = tenant.businessInfo as BusinessInfo;
  const preview = items.some((item) => item.isFeatured) ? items.filter((item) => item.isFeatured) : items.slice(0, 6);
  const formattedHours = hours.closed ? hours.reason ?? "Closed today" : hours.slots.map((slot) => `${slot.startTime}–${slot.endTime}`).join(" · ");

  return <main className="min-h-screen bg-[var(--public-background)] text-[var(--public-text)]">
    <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24"><p className="text-sm font-medium uppercase tracking-wide text-[var(--public-text-muted)]">Welcome to</p><h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{tenant.name}</h1><p className="mt-5 text-lg text-[var(--public-text-muted)]">Today’s hours: {formattedHours}</p><TrackedLink href={`/${tenant.slug}/book`} tenant={tenant.slug} event="book_click" className="mt-7 inline-flex min-h-12 items-center rounded-md bg-[var(--public-primary)] px-6 font-semibold text-white">Book a visit</TrackedLink></section>
    <section className="mx-auto max-w-5xl px-5 pb-16"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-2xl font-semibold">Menu highlights</h2><a className="min-h-11 px-2 py-3 text-sm font-medium underline" href={`/${tenant.slug}/menu`}>Full menu</a></div><MenuPublicView items={preview} currency={tenant.currency} /></section>
    <section className="border-t border-[var(--public-border)] bg-[var(--public-surface)]"><div className="mx-auto max-w-5xl space-y-3 px-5 py-10"><h2 className="text-xl font-semibold">Visit us</h2>{business.phone && <p><a href={`tel:${business.phone}`} className="underline">{business.phone}</a></p>}{business.address && <p>{business.mapUrl ? <a href={business.mapUrl} target="_blank" rel="noreferrer" className="underline">{business.address} · Map</a> : business.address}</p>}{business.instagramUrl && <p><a href={business.instagramUrl} target="_blank" rel="noreferrer" className="underline">Instagram</a></p>}</div></section>
  </main>;
}
