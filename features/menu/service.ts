// Provides the tenant-scoped menu queries shared by the admin and public site.
import { prisma } from "@/lib/prisma";

export async function listPublicMenu(tenantId: string) {
  return prisma.menuItem.findMany({
    where: { tenantId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listMenuForAdmin(tenantId: string) {
  return listPublicMenu(tenantId);
}
