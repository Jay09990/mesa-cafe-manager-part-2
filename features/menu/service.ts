// Provides the tenant-scoped menu queries shared by the admin and public site.
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

export async function listPublicMenu(tenantId: string) {
  return listCachedPublicMenu(tenantId);
}

async function listCachedPublicMenu(tenantId: string) {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag(`tenant-menu:${tenantId}`);
  const items = await prisma.menuItem.findMany({
    where: { tenantId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return items.map((item) => ({ ...item, price: item.price.toString() }));
}

export async function listMenuForAdmin(tenantId: string) {
  return prisma.menuItem.findMany({
    where: { tenantId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}
