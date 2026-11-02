// Renders the booking list and owner-side booking entry workflow.
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireTenantRole } from "@/features/auth/guards";
import { AdminBookingManager } from "@/features/booking/components/AdminBookingManager";
import { TableSkeleton } from "@/features/admin-panel/components/LoadingSkeletons";

async function BookingContent({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const access = await requireTenantRole(tenant, ["owner", "manager", "staff_bookings"]);
  if (!access) redirect("/sign-in");
  return <AdminBookingManager tenant={tenant} />;
}

export default function BookingsPage({ params }: { params: Promise<{ tenant: string }> }) {
  return <><h1 className="mb-2 text-xl font-semibold">Bookings</h1><Suspense fallback={<TableSkeleton columns={7} rows={5} label="Loading bookings" />}><BookingContent params={params} /></Suspense></>;
}
