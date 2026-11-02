// Displays customer summaries without offering edits or marketing actions.
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type CustomerSummary = { id: string; name: string; phone: string; email: string | null; bookingCount: number; noShowCount: number; lastBookingAt: Date | null };

export function CustomerList({ customers }: { customers: CustomerSummary[] }) {
  return <Card><CardContent><div className="overflow-x-auto">
    <Table><TableHeader><TableRow>{["Name", "Phone", "Email", "Bookings", "No-shows", "Last booking"].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{customers.map((customer) => <TableRow key={customer.id}><TableCell>{customer.name}</TableCell><TableCell>{customer.phone}</TableCell><TableCell>{customer.email ?? "—"}</TableCell><TableCell>{customer.bookingCount}</TableCell><TableCell>{customer.noShowCount}</TableCell><TableCell>{customer.lastBookingAt?.toLocaleDateString("en-IN") ?? "—"}</TableCell></TableRow>)}
        {customers.length === 0 && <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No customers yet — they&apos;ll appear here after their first booking.</TableCell></TableRow>}
      </TableBody>
    </Table>
  </div></CardContent></Card>;
}
