// Lets owners and managers enter today or past sales and review saved history.
"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { focusFormField } from "@/lib/form-feedback";
import { readApiResponse } from "@/lib/read-api-response";

type Entry = { date: string; ordersCount: number; cash: number | string; upi: number | string; card: number | string; other: number | string; totalSales: number | string; notes: string | null };
export function SalesLogManager({ tenant, today }: { tenant: string; today: string }) {
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["sales-log", tenant], queryFn: async () => {
    const response = await fetch(`/api/admin/sales-log?tenant=${encodeURIComponent(tenant)}`);
    const result = await readApiResponse<{ entries: Entry[] }>(response); if (!result.success) throw new Error(result.errormsg); return result.data.entries;
  } });
  async function submit(formData: FormData, form: HTMLFormElement) {
    setSaving(true);
    const values = { tenant, ordersCount: Number(formData.get("ordersCount")), cash: Number(formData.get("cash")), upi: Number(formData.get("upi")), card: Number(formData.get("card")), other: Number(formData.get("other")), notes: String(formData.get("notes") || "") };
    try {
      const response = await fetch(`/api/admin/sales-log/${date}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
      const result = await readApiResponse<unknown>(response);
      if (!result.success) { toast.error(result.errormsg); focusFormField(form, result.errormsg); return; }
      toast.success("Sales saved."); await queryClient.invalidateQueries({ queryKey: ["sales-log", tenant] });
    } catch { const error = "Could not save sales. Please try again."; toast.error(error); focusFormField(form, error); } finally { setSaving(false); }
  }
  const selected = query.data?.find((entry) => entry.date === date);
  return <div className="space-y-7">
    <section className="rounded-lg border border-neutral-200 bg-white p-5"><h2 className="text-lg font-semibold">Log sales</h2>
      <form onSubmit={(event) => { event.preventDefault(); void submit(new FormData(event.currentTarget), event.currentTarget); }} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Date<input name="date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} required className="mt-1 h-11 w-full rounded border border-neutral-300 px-3" /></label>
        <label className="text-sm font-medium">Orders<input name="ordersCount" type="number" min="0" step="1" inputMode="numeric" defaultValue={selected?.ordersCount ?? 0} key={`${date}-orders`} className="mt-1 h-11 w-full rounded border border-neutral-300 px-3" /></label>
        {(["cash", "upi", "card", "other"] as const).map((mode) => <label key={mode} className="text-sm font-medium">{mode.toUpperCase()}<input name={mode} type="number" min="0" step="0.01" inputMode="decimal" defaultValue={selected ? Number(selected[mode]) : 0} key={`${date}-${mode}`} className="mt-1 h-11 w-full rounded border border-neutral-300 px-3" /></label>)}
        <label className="text-sm font-medium sm:col-span-2">Notes (optional)<textarea name="notes" defaultValue={selected?.notes ?? ""} key={`${date}-notes`} maxLength={1000} rows={2} className="mt-1 w-full rounded border border-neutral-300 p-3" /></label>
        <button disabled={saving} className="min-h-11 rounded-md bg-neutral-900 px-4 font-semibold text-white disabled:opacity-50 sm:col-span-2">{saving ? "Saving sales…" : "Save sales"}</button>
      </form>
    </section>
    <section><h2 className="mb-3 text-lg font-semibold">Recent sales</h2>{query.isLoading && <p>Loading sales…</p>}{query.isError && <p role="alert">Could not load sales. Refresh the page to try again.</p>}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-neutral-100"><tr>{["Date", "Orders", "Cash", "UPI", "Card", "Other", "Total"].map((label) => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{query.data?.map((entry) => <tr key={entry.date} className="border-t border-neutral-200"><td className="p-3">{entry.date}</td><td className="p-3">{entry.ordersCount}</td>{(["cash", "upi", "card", "other", "totalSales"] as const).map((field) => <td className="p-3" key={field}>{Number(entry[field]).toFixed(2)}</td>)}</tr>)}</tbody></table></div>
    </section>
  </div>;
}
