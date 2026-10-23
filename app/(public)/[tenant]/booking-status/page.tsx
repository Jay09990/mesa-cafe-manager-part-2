// Displays only the current status and booking summary returned by the public status API.
import { notFound } from "next/navigation";
import { getBookingById } from "@/features/booking/server/service";

export default async function BookingStatusPage({ params, searchParams }: { params: Promise<{ tenant: string }>; searchParams: Promise<{ id?: string | string[] }> }) {
  const [{ tenant }, query] = await Promise.all([params, searchParams]);
  const bookingId = typeof query.id === "string" ? query.id : undefined;
  const booking = bookingId ? await getBookingById(bookingId) : null;
  if (!booking || booking.tenant.slug !== tenant) notFound();
  const message = booking.status === "pending" ? "Request received — the café will confirm shortly" : booking.status === "confirmed" ? "Booking confirmed" : `Booking ${booking.status}`;
  return <main className="mx-auto min-h-screen max-w-xl px-4 py-16"><section className="rounded-xl border border-neutral-200 bg-white p-6"><h1 className="text-2xl font-semibold">{message}</h1><p className="mt-3 text-neutral-700">{booking.tenant.name} · {booking.date} at {booking.time} · {booking.partySize} seats</p></section></main>;
}
