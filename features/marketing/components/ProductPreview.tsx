// Shows an illustrative, non-interactive preview of Mesa's owner dashboard.
import { CalendarDays, ChartNoAxesCombined, Clock3, UsersRound } from "lucide-react";

const sampleMetrics = [
  { label: "Sales today", value: "₹12,450", detail: "Example summary", Icon: ChartNoAxesCombined },
  { label: "Bookings", value: "12", detail: "28 seats", Icon: CalendarDays },
  { label: "Orders logged", value: "36", detail: "Daily sales entry", Icon: Clock3 },
  { label: "Customers", value: "84", detail: "From bookings", Icon: UsersRound },
];

export function ProductPreview() {
  return (
    <div role="img" aria-label="Illustrative Mesa dashboard preview showing sales, bookings, orders, and customers" className="relative mx-auto w-full max-w-xl">
      <div aria-hidden="true" className="absolute -inset-3 rounded-[2rem] bg-[var(--public-accent-tint)]/70 blur-xl" />
      <div aria-hidden="true" className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_20px_60px_-15px_rgba(181,83,28,0.25)]">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-neutral-900 text-sm font-bold text-white">M</div><div><p className="text-sm font-semibold">Your café</p><p className="text-xs text-neutral-500">Today at a glance</p></div></div>
          <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600">Example view</span>
        </div>
        <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-4 sm:gap-4 sm:p-5">
          {sampleMetrics.map(({ label, value, detail, Icon }) => (
            <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-neutral-500 sm:text-sm">{label}</span><Icon aria-hidden="true" className={`size-4 ${label === "Sales today" ? "text-[var(--public-accent)]" : "text-neutral-500"}`} /></div>
              <p className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{value}</p>
              <p className="mt-1 text-xs text-neutral-500">{detail}</p>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4 sm:px-5 sm:pb-5"><div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3"><div><p className="text-sm font-semibold">Next booking</p><p className="mt-1 text-xs text-neutral-500">A. Sharma · 4 seats</p></div><span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">6:30 PM</span></div></div>
      </div>
    </div>
  );
}
