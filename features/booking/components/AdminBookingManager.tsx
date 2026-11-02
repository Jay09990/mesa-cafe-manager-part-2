// Gives booking staff a direct entry form and a tenant-scoped booking list.
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { focusFormField } from "@/lib/form-feedback";
import { readApiResponse } from "@/lib/read-api-response";
import { BoneyardSkeleton, TableSkeleton } from "@/features/admin-panel/components/LoadingSkeletons";
import { LoadingSpinner } from "@/features/admin-panel/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Booking = { id: string; name: string; phone: string; date: string; time: string; partySize: number; source: string; status: string };

export function AdminBookingManager({ tenant }: { tenant: string }) {
  const queryClient = useQueryClient();
  const bookingsQuery = useQuery({
    queryKey: ["admin-bookings", tenant],
    queryFn: async () => {
      const response = await fetch(`/api/admin/bookings?tenant=${encodeURIComponent(tenant)}`);
      const result = await readApiResponse<{ bookings: Booking[] }>(response);
      if (!result.success) throw new Error(result.errormsg);
      return result.data.bookings as Booking[];
    },
  });
  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, string | number | boolean>) => {
      const response = await fetch("/api/admin/bookings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...values, tenant }) });
      const result = await readApiResponse<Booking>(response);
      if (!result.success) throw new Error(result.errormsg);
      return result.data;
    },
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-bookings", tenant] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-today", tenant] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-trends", tenant] }),
    ]),
  });

  async function submit(formData: FormData, form: HTMLFormElement) {
    try {
      await saveMutation.mutateAsync({
        name: String(formData.get("name")), phone: String(formData.get("phone")), email: String(formData.get("email") || ""),
        partySize: Number(formData.get("partySize")), date: String(formData.get("date")), time: String(formData.get("time")),
        notes: String(formData.get("notes") || ""), source: String(formData.get("source")), sendConfirmation: formData.get("sendConfirmation") === "on",
      });
      form.reset();
    } catch (cause) { focusFormField(form, cause instanceof Error ? cause.message : "booking details"); }
  }

  return <div className="w-full space-y-2">
    <Card>
      <CardHeader><CardTitle>Add booking</CardTitle></CardHeader>
      <CardContent><form onSubmit={(event) => { event.preventDefault(); void submit(new FormData(event.currentTarget), event.currentTarget); }} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="booking-name">Name</Label><Input id="booking-name" name="name" required /></div>
        <div className="space-y-1.5"><Label htmlFor="booking-phone">Phone</Label><Input id="booking-phone" name="phone" type="tel" required /></div>
        <div className="space-y-1.5"><Label htmlFor="booking-email">Email (optional)</Label><Input id="booking-email" name="email" type="email" /></div>
        <div className="space-y-1.5"><Label htmlFor="booking-party-size">Party size</Label><Input id="booking-party-size" name="partySize" type="number" min="1" inputMode="numeric" required defaultValue="2" /></div>
        <div className="space-y-1.5"><Label htmlFor="booking-date">Date</Label><Input id="booking-date" name="date" type="date" required /></div>
        <div className="space-y-1.5"><Label htmlFor="booking-time">Time</Label><Input id="booking-time" name="time" type="time" required /></div>
        <div className="space-y-1.5"><Label htmlFor="booking-source">Source</Label><Select name="source" defaultValue="phone"><SelectTrigger id="booking-source"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="phone">Phone</SelectItem><SelectItem value="walk_in">Walk-in</SelectItem></SelectContent></Select></div>
        <div className="space-y-1.5"><Label htmlFor="booking-notes">Notes (optional)</Label><Input id="booking-notes" name="notes" /></div>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="sendConfirmation" />Email confirmation if an address is provided</label>
        {saveMutation.isError && <p role="alert" className="text-sm text-destructive sm:col-span-2">{saveMutation.error.message}</p>}
        {saveMutation.isSuccess && <p role="status" className="text-sm text-muted-foreground sm:col-span-2">Booking added.</p>}
        <CardFooter className="justify-end p-0 sm:col-span-2"><Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? <LoadingSpinner label="Saving…" /> : "Add booking"}</Button></CardFooter>
      </form></CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>Bookings</CardTitle></CardHeader>
      <CardContent>
      {bookingsQuery.isError && <p role="alert">We could not load bookings. Refresh the page to try again.</p>}
      <BoneyardSkeleton name="booking-table" loading={bookingsQuery.isLoading} fallback={<TableSkeleton columns={7} rows={5} label="Loading bookings" />} fixture={<TableSkeleton columns={7} rows={5} label="Loading bookings" />}>
      <div className="overflow-x-auto">
        <Table><TableHeader><TableRow>{["Date", "Time", "Name", "Phone", "Party", "Source", "Status"].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{bookingsQuery.data?.map((booking) => <TableRow key={booking.id}><TableCell>{booking.date}</TableCell><TableCell>{booking.time}</TableCell><TableCell>{booking.name}</TableCell><TableCell>{booking.phone}</TableCell><TableCell>{booking.partySize}</TableCell><TableCell><Badge variant="secondary">{booking.source.replaceAll("_", " ")}</Badge></TableCell><TableCell><Badge variant={booking.status === "pending" ? "outline" : booking.status === "cancelled" || booking.status === "no_show" ? "destructive" : "default"}>{booking.status === "no_show" ? "No-show" : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</Badge></TableCell></TableRow>)}
            {bookingsQuery.data?.length === 0 && <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No bookings yet — share your booking link or add one above.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      </BoneyardSkeleton>
      </CardContent>
    </Card>
  </div>;
}
