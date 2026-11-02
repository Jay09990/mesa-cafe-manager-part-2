// Lets owners and managers enter today or past sales and review saved history.
"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { focusFormField } from "@/lib/form-feedback";
import { readApiResponse } from "@/lib/read-api-response";
import { BoneyardSkeleton, TableSkeleton } from "@/features/admin-panel/components/LoadingSkeletons";
import { LoadingSpinner } from "@/features/admin-panel/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
      toast.success("Sales saved.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sales-log", tenant] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-today", tenant] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-trends", tenant] }),
      ]);
    } catch { const error = "Could not save sales. Please try again."; toast.error(error); focusFormField(form, error); } finally { setSaving(false); }
  }
  const selected = query.data?.find((entry) => entry.date === date);
  return <div className="w-full space-y-6">
    <Card><CardHeader><CardTitle>Log sales</CardTitle></CardHeader><CardContent>
      <form onSubmit={(event) => { event.preventDefault(); void submit(new FormData(event.currentTarget), event.currentTarget); }} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="sales-date">Date</Label><Input id="sales-date" name="date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label htmlFor="sales-orders">Orders</Label><Input id="sales-orders" name="ordersCount" type="number" min="0" step="1" inputMode="numeric" defaultValue={selected?.ordersCount ?? 0} key={`${date}-orders`} /></div>
        {(["cash", "upi", "card", "other"] as const).map((mode) => <div key={mode} className="space-y-1.5"><Label htmlFor={`sales-${mode}`}>{mode === "upi" ? "UPI" : mode.charAt(0).toUpperCase() + mode.slice(1)}</Label><Input id={`sales-${mode}`} name={mode} type="number" min="0" step="0.01" inputMode="decimal" defaultValue={selected ? Number(selected[mode]) : 0} key={`${date}-${mode}`} /></div>)}
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="sales-notes">Notes (optional)</Label><textarea id="sales-notes" name="notes" defaultValue={selected?.notes ?? ""} key={`${date}-notes`} maxLength={1000} rows={2} className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm" /></div>
        <CardFooter className="justify-end p-0 sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? <LoadingSpinner label="Saving sales…" /> : "Save sales"}</Button></CardFooter>
      </form>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Recent sales</CardTitle></CardHeader><CardContent>{query.isError && <p role="alert">Could not load sales. Refresh the page to try again.</p>}
      <BoneyardSkeleton name="sales-table" loading={query.isLoading} fallback={<TableSkeleton columns={7} rows={5} label="Loading sales" />} fixture={<TableSkeleton columns={7} rows={5} label="Loading sales" />}>
      <div className="overflow-x-auto"><Table><TableHeader><TableRow>{["Date", "Orders", "Cash", "UPI", "Card", "Other", "Total"].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{query.data?.map((entry) => <TableRow key={entry.date}><TableCell>{entry.date}</TableCell><TableCell>{entry.ordersCount}</TableCell>{(["cash", "upi", "card", "other", "totalSales"] as const).map((field) => <TableCell key={field}>{Number(entry[field]).toFixed(2)}</TableCell>)}</TableRow>)}{query.data?.length === 0 && <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No sales logged yet — log today&apos;s sales above.</TableCell></TableRow>}</TableBody></Table></div>
      </BoneyardSkeleton>
    </CardContent></Card>
  </div>;
}
