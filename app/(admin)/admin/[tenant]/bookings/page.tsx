// Renders the booking list and owner-side booking entry workflow.
import { redirect } from "next/navigation";
import { requireTenantRole } from "@/features/auth/guards";
import { AdminBookingManager } from "@/features/booking/components/AdminBookingManager";

export default async function BookingsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const access = await requireTenantRole(tenant, ["owner", "manager", "staff_bookings"]);
  if (!access) redirect("/sign-in");
  return <><h1 className="mb-5 text-2xl font-semibold">Bookings</h1><AdminBookingManager tenant={tenant} /></>;
}
