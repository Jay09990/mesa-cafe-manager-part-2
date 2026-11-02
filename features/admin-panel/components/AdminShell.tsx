// Provides the grouped sidebar and compact workspace header for admin screens.
import type { ReactNode } from "react";
import { canAccessRole } from "@/features/auth/guards";
import { TrialBanner } from "@/features/billing/components/TrialBanner";
import { AdminNavigation } from "@/features/admin-panel/components/AdminNavigation";
import { AdminThemeRoot } from "@/features/admin-panel/components/AdminThemeProvider";

export function AdminShell({ tenant, role, children, trial }: { tenant: string; role: string; children: ReactNode; trial: { trialEndsAt: Date; timezone: string; status: string } }) {
  const groups = [
    { title: "Workspace", links: [
      { label: "Today", href: `/admin/${tenant}/dashboard`, capability: "dashboard" as const },
      { label: "Bookings", href: `/admin/${tenant}/bookings`, capability: "bookings" as const },
      { label: "Customers", href: `/admin/${tenant}/customers`, capability: "customers" as const },
    ] },
    { title: "Business", links: [
      { label: "Menu", href: `/admin/${tenant}/menu`, capability: "menu" as const },
      { label: "Sales", href: `/admin/${tenant}/sales`, capability: "sales" as const },
    ] },
    { title: "Account", links: [
      { label: "Billing", href: `/admin/${tenant}/billing`, capability: "billing" as const },
    ] },
  ].map((group) => ({ ...group, links: group.links.filter((link) => canAccessRole(role, link.capability)) })).filter((group) => group.links.length > 0);

  return <AdminThemeRoot>
    <div className="min-h-screen bg-background text-foreground">
      <TrialBanner {...trial} />
      <AdminNavigation tenant={tenant} role={role} groups={groups}>
        <main className="min-w-0 flex-1 p-6 md:p-8">{children}</main>
      </AdminNavigation>
    </div>
  </AdminThemeRoot>;
}
