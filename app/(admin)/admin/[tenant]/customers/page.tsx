// Renders the read-only customer history derived from bookings.
import { redirect } from "next/navigation";
import { requireTenantRole } from "@/features/auth/guards";
import { CustomerList } from "@/features/customers/components/CustomerList";
import { prisma } from "@/lib/prisma";

export default async function CustomersPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const access = await requireTenantRole(tenant, ["owner", "manager", "staff_bookings"]);
  if (!access) redirect("/sign-in");
  const customers = await prisma.customer.findMany({
    where: { tenantId: access.tenantId },
    select: { id: true, name: true, phone: true, email: true, bookingCount: true, noShowCount: true, lastBookingAt: true },
    orderBy: { name: "asc" },
  });
  return <><h1 className="mb-5 text-2xl font-semibold">Customers</h1><CustomerList customers={customers} /></>;
}
