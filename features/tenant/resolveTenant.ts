// Resolves tenant records from URL slugs for local and custom public host routing.
import { prisma } from "@/lib/prisma";

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

export async function getTenantForRequest(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("tenant") ?? getTenantSlugFromHost(request.headers.get("host"));
  return slug ? getTenantBySlug(slug) : null;
}
