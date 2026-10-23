// Returns a read-only, tenant-scoped customer list for booking staff.
import { requireTenantRole } from "@/features/auth/guards";
import { apiError, apiSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const access = await requireTenantRole(url.searchParams.get("tenant") ?? "", ["owner", "manager", "staff_bookings"]);
  if (!access) return apiError("You do not have access to customers for this café.", 403);
  const search = url.searchParams.get("search")?.trim();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20) || 20));
  const customers = await prisma.customer.findMany({
    where: { tenantId: access.tenantId, ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { phone: { contains: search } }] } : {}) },
    select: { id: true, name: true, phone: true, email: true, bookingCount: true, noShowCount: true, lastBookingAt: true },
    orderBy: { name: "asc" },
    skip: (page - 1) * limit,
    take: limit,
  });
  return apiSuccess({ customers, page, limit });
}
