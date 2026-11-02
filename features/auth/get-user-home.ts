import { prisma } from "@/lib/prisma";

export async function getUserHome(userId: string): Promise<string | null> {
  const membership = await prisma.staffMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { role: true, tenant: { select: { slug: true } } },
  });
  if (!membership) return null;

  const page = membership.role === "owner" || membership.role === "manager" ? "dashboard" : "bookings";
  return `/admin/${membership.tenant.slug}/${page}`;
}
