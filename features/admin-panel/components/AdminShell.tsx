// Provides a fixed neutral navigation shell for Mesa's internal admin screens.
import Link from "next/link";
import type { ReactNode } from "react";
import { canAccessRole } from "@/features/auth/guards";

export function AdminShell({ tenant, role, children }: { tenant: string; role: string; children: ReactNode }) {
  const links = [
    { label: "Bookings", href: `/admin/${tenant}/bookings`, capability: "bookings" as const },
    { label: "Customers", href: `/admin/${tenant}/customers`, capability: "customers" as const },
    { label: "Menu", href: `/admin/${tenant}/menu`, capability: "menu" as const },
    { label: "Sales", href: `/admin/${tenant}/sales`, capability: "sales" as const },
    { label: "Settings", href: `/admin/${tenant}/settings`, capability: "settings" as const },
    { label: "Billing", href: `/admin/${tenant}/billing`, capability: "billing" as const },
  ];
  return <div className="min-h-screen bg-neutral-50 text-neutral-900"><header className="border-b border-neutral-200 bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4"><Link href={`/admin/${tenant}/bookings`} className="text-lg font-semibold">Mesa</Link><nav aria-label="Admin" className="flex flex-wrap gap-1">{links.filter((link) => canAccessRole(role, link.capability)).map((link) => <Link key={link.href} href={link.href} className="min-h-11 rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-100">{link.label}</Link>)}<a href={`/${tenant}`} className="min-h-11 rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-100">Public site</a></nav></div></header><main className="mx-auto max-w-7xl px-4 py-6">{children}</main></div>;
}
