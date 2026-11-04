// Lets a guest choose an available time and request a booking from a phone-friendly form.
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trackPublicUsage } from "@/features/usage/components/UsagePing";
import { focusFormField } from "@/lib/form-feedback";
import { readApiResponse } from "@/lib/read-api-response";
import { LoadingSpinner } from "@/features/admin-panel/components/LoadingSpinner";

type Slot = { time: string; endTime: string; available: boolean; capacityRemaining: number };

export function PublicBookingForm({ tenant, cafeName }: { tenant: string; cafeName: string }) {
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [started, setStarted] = useState(false);
  const todayDate = new Date().toISOString().split("T")[0];
  function markBookingStarted() {
    if (started) return;
    setStarted(true);
    trackPublicUsage(tenant, "booking_started");
  }
  const slotsQuery = useQuery({
    queryKey: ["availability", tenant, date, partySize],
    enabled: Boolean(date),
    queryFn: async () => {
      const params = new URLSearchParams({ tenant, date, partySize: String(partySize) });
      const response = await fetch(`/api/booking/availability?${params}`);
      const result = await readApiResponse<{ date: string; closed: boolean; closedReason: string | null; slots: Slot[] }>(response);
      if (!result.success) throw new Error(result.errormsg);
      return { ...result.data!, requestedPartySize: partySize };
    },
  });
  const bookingMutation = useMutation({
    mutationFn: async (values: Record<string, string | number>) => {
      const response = await fetch(`/api/booking?tenant=${encodeURIComponent(tenant)}`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values),
      });
      const result = await readApiResponse<{ id: string; status: "pending" | "confirmed"; confirmationSentTo: string | null }>(response);
      if (!result.success) throw new Error(result.errormsg);
      return result.data as { id: string; status: "pending" | "confirmed"; confirmationSentTo: string | null };
    },
    onSuccess: (result) => {
      setMessage(result.status === "pending" ? "Request received — the café will confirm shortly" : "Booking confirmed");
    },
  });

  async function submit(formData: FormData, form: HTMLFormElement) {
    setMessage("");
    try {
      const result = await bookingMutation.mutateAsync({
        name: String(formData.get("name")),
        phone: String(formData.get("phone")),
        email: String(formData.get("email") || ""),
        partySize,
        date,
        time,
        notes: String(formData.get("notes") || ""),
        website: String(formData.get("website") || ""),
      });
      window.history.replaceState(null, "", `/${tenant}/booking-status?id=${encodeURIComponent(result.id)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not create your booking. Please try again.";
      setTime("");
      if (message.toLowerCase().includes("time")) await slotsQuery.refetch();
      setMessage(message); focusFormField(form, message);
    }
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void submit(new FormData(event.currentTarget), event.currentTarget); }} className="mx-auto w-full max-w-xl space-y-5 rounded-xl border border-neutral-200 bg-white p-5 sm:p-7">
      <h1 className="text-2xl font-semibold">Book a visit at {cafeName}</h1>
      <label className="block text-base font-medium">Date<input type="date" min={todayDate} required value={date} onFocus={markBookingStarted} onChange={(event) => { markBookingStarted(); setDate(event.target.value); setTime(""); }} className="mt-2 h-12 w-full rounded-md border border-neutral-300 px-3" /></label>
      <label className="block text-base font-medium">Party size<input type="number" min={1} max={1000} inputMode="numeric" required value={partySize} onFocus={markBookingStarted} onChange={(event) => { markBookingStarted(); setPartySize(Number(event.target.value)); setTime(""); }} className="mt-2 h-12 w-full rounded-md border border-neutral-300 px-3" /></label>
      {date && <fieldset><legend className="text-base font-medium">Available time</legend>
        {slotsQuery.isFetching ? <p className="mt-2 text-neutral-600">Loading times…</p> : slotsQuery.data?.closed ? <p className="mt-2 text-neutral-600">{slotsQuery.data.closedReason ?? "The café is closed on this date."}</p> :
          slotsQuery.data?.slots.filter((slot) => slot.available).length === 0 ? <p className="mt-2 text-sm text-neutral-600" role="status">No tables available for this party size on this date. Please try another date or party size.</p> :
          <div className="mt-2 grid grid-cols-3 gap-2">{slotsQuery.data?.slots.filter((slot) => slot.available).map((slot) => <label key={slot.time} className="cursor-pointer"><input className="peer sr-only" type="radio" name="time" value={slot.time} required checked={time === slot.time} onChange={() => setTime(slot.time)} /><span className="flex min-h-11 items-center justify-center rounded-md border border-neutral-300 peer-checked:border-neutral-900 peer-checked:bg-neutral-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-900 peer-focus-visible:ring-offset-2">{slot.time}</span></label>)}</div>}
      </fieldset>}
      <label className="block text-base font-medium">Your name<input name="name" autoComplete="name" required maxLength={100} className="mt-2 h-12 w-full rounded-md border border-neutral-300 px-3" /></label>
      <label className="block text-base font-medium">Phone number<input name="phone" type="tel" autoComplete="tel" required maxLength={30} className="mt-2 h-12 w-full rounded-md border border-neutral-300 px-3" /></label>
      <label className="block text-base font-medium">Email (optional)<input name="email" type="email" autoComplete="email" className="mt-2 h-12 w-full rounded-md border border-neutral-300 px-3" /></label>
      <label className="block text-base font-medium">Notes (optional)<textarea name="notes" maxLength={1000} rows={3} className="mt-2 w-full rounded-md border border-neutral-300 p-3" /></label>
      <label aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      {slotsQuery.isError && <p role="alert" className="text-sm text-red-700">We could not load times. Please try again.</p>}
      {message && <p role="status" className="text-sm text-neutral-800">{message}</p>}
      <button disabled={bookingMutation.isPending || slotsQuery.isFetching || !date || slotsQuery.data?.date !== date || slotsQuery.data?.requestedPartySize !== partySize || !slotsQuery.data?.slots.some((slot) => slot.time === time && slot.available)} className="min-h-11 w-full rounded-md bg-neutral-900 px-4 font-semibold text-white disabled:opacity-50">{bookingMutation.isPending ? <LoadingSpinner label="Sending…" /> : slotsQuery.isFetching ? <LoadingSpinner label="Checking times…" /> : "Request booking"}</button>
    </form>
  );
}
