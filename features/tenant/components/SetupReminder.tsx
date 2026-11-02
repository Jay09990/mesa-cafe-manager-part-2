"use client";

import Link from "next/link";
import { useState } from "react";

export function SetupReminder({ tenant, show }: { tenant: string; show: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  if (!show || dismissed) return null;
  return <aside className="flex items-center justify-between gap-2 border-b border-amber-300 bg-amber-50 px-2 py-1.5 text-sm text-amber-950" aria-label="Finish setting up your café">
    <p><strong>Finish setting up your café.</strong> Add your address, opening hours, and capacity to get bookings ready.</p>
    <div className="flex shrink-0 items-center gap-3"><Link href={`/admin/${tenant}/settings`} className="font-semibold underline">Open settings</Link><button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss setup reminder" className="min-h-10 rounded px-2 underline">Dismiss</button></div>
  </aside>;
}
