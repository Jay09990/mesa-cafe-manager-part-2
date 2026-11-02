// Resolves tenant records from URL slugs for local and custom public host routing.
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

export function getTenantSlugFromHost(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  const labels = hostname.split(".");
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return labels.length > 1 ? labels[0] : null;
  if (labels.length >= 3 && labels.at(-2) === "mesa") return labels[0];
  return null;
}

export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({ where: { slug } });
}

export async function getCachedPublicTenantBySlug(slug: string) {
  return getCachedPublicTenant(slug);
}

async function getCachedPublicTenant(slug: string) {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag(`tenant-public:${slug}`);
  return prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true, name: true, slug: true, tier: true, subscriptionStatus: true,
      theme: true, businessInfo: true, businessCategory: true, openingHours: true,
      timezone: true, currency: true, autoConfirmBookings: true,
    },
  });
}

export async function getTenantForRequest(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("tenant") ?? getTenantSlugFromHost(request.headers.get("host"));
  return slug ? getTenantBySlug(slug) : null;
}

export async function getCachedPublicTenantForRequest(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("tenant") ?? getTenantSlugFromHost(request.headers.get("host"));
  return slug ? getCachedPublicTenantBySlug(slug) : null;
}
