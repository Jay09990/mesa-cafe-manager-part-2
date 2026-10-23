// Gives booking staff a direct entry form and a tenant-scoped booking list.
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Booking = { id: string; name: string; phone: string; date: string; time: string; partySize: number; source: string; status: string };

export function AdminBookingManager({ tenant }: { tenant: string }) {
  const queryClient = useQueryClient();
  const bookingsQuery = useQuery({
    queryKey: ["admin-bookings", tenant],
    queryFn: async () => {
      const result = await fetch(`/api/admin/bookings?tenant=${encodeURIComponent(tenant)}`).then((response) => response.json());
      if (!result.success) throw new Error(result.errormsg);
      return result.data.bookings as Booking[];
    },
  });
  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, string | number | boolean>) => {
      const response = await fetch("/api/admin/bookings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...values, tenant }) });
      const result = await response.json();
      if (!result.success) throw new Error(result.errormsg);
      return result.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-bookings", tenant] }),
  });

  async function submit(formData: FormData) {
    try {
      await saveMutation.mutateAsync({
        name: String(formData.get("name")), phone: String(formData.get("phone")), email: String(formData.get("email") || ""),
        partySize: Number(formData.get("partySize")), date: String(formData.get("date")), time: String(formData.get("time")),
        notes: String(formData.get("notes") || ""), source: String(formData.get("source")), sendConfirmation: formData.get("sendConfirmation") === "on",
      });
      (document.querySelector("form") as HTMLFormElement | null)?.reset();
    } catch { /* The mutation error is shown below. */ }
  }

  return <div className="space-y-8">
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-lg font-semibold">Add booking</h2>
      <form action={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Name<input name="name" required className="mt-1 h-11 w-full rounded border border-neutral-300 px-3" /></label>
        <label className="text-sm font-medium">Phone<input name="phone" type="tel" required className="mt-1 h-11 w-full rounded border border-neutral-300 px-3" /></label>
        <label className="text-sm font-medium">Email (optional)<input name="email" type="email" className="mt-1 h-11 w-full rounded border border-neutral-300 px-3" /></label>
        <label className="text-sm font-medium">Party size<input name="partySize" type="number" min="1" inputMode="numeric" required defaultValue="2" className="mt-1 h-11 w-full rounded border border-neutral-300 px-3" /></label>
        <label className="text-sm font-medium">Date<input name="date" type="date" required className="mt-1 h-11 w-full rounded border border-neutral-300 px-3" /></label>
        <label className="text-sm font-medium">Time<input name="time" type="time" required className="mt-1 h-11 w-full rounded border border-neutral-300 px-3" /></label>
        <label className="text-sm font-medium">Source<select name="source" className="mt-1 h-11 w-full rounded border border-neutral-300 px-3"><option value="phone">Phone</option><option value="walk_in">Walk-in</option></select></label>
        <label className="text-sm font-medium">Notes (optional)<input name="notes" className="mt-1 h-11 w-full rounded border border-neutral-300 px-3" /></label>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="sendConfirmation" />Email confirmation if an address is provided</label>
        {saveMutation.isError && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{saveMutation.error.message}</p>}
        {saveMutation.isSuccess && <p role="status" className="text-sm text-green-800 sm:col-span-2">Booking added.</p>}
        <button disabled={saveMutation.isPending} className="min-h-11 rounded-md bg-neutral-900 px-4 font-semibold text-white disabled:opacity-50 sm:col-span-2">{saveMutation.isPending ? "Saving…" : "Add booking"}</button>
      </form>
    </section>
    <section>
      <h2 className="mb-3 text-lg font-semibold">Bookings</h2>
      {bookingsQuery.isLoading && <p>Loading bookings…</p>}
      {bookingsQuery.isError && <p role="alert">We could not load bookings. Refresh the page to try again.</p>}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm"><thead className="bg-neutral-100"><tr>{["Date", "Time", "Name", "Phone", "Party", "Source", "Status"].map((label) => <th key={label} className="p-3 font-semibold">{label}</th>)}</tr></thead>
          <tbody>{bookingsQuery.data?.map((booking) => <tr key={booking.id} className="border-t border-neutral-200"><td className="p-3">{booking.date}</td><td className="p-3">{booking.time}</td><td className="p-3">{booking.name}</td><td className="p-3">{booking.phone}</td><td className="p-3">{booking.partySize}</td><td className="p-3">{booking.source}</td><td className="p-3">{booking.status}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  </div>;
}
