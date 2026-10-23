// Displays customer summaries without offering edits or marketing actions.
export type CustomerSummary = { id: string; name: string; phone: string; email: string | null; bookingCount: number; noShowCount: number; lastBookingAt: Date | null };

export function CustomerList({ customers }: { customers: CustomerSummary[] }) {
  if (customers.length === 0) return <p className="rounded-lg border border-neutral-200 bg-white p-5">No customers yet. Customers appear after the first booking.</p>;
  return <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-neutral-100"><tr>{["Name", "Phone", "Email", "Bookings", "No-shows", "Last booking"].map((label) => <th key={label} className="p-3 font-semibold">{label}</th>)}</tr></thead><tbody>{customers.map((customer) => <tr key={customer.id} className="border-t border-neutral-200"><td className="p-3">{customer.name}</td><td className="p-3">{customer.phone}</td><td className="p-3">{customer.email ?? "—"}</td><td className="p-3">{customer.bookingCount}</td><td className="p-3">{customer.noShowCount}</td><td className="p-3">{customer.lastBookingAt?.toLocaleDateString("en-IN") ?? "—"}</td></tr>)}</tbody></table></div>;
}
