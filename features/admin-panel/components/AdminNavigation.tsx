"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";
import { CalendarClock, CalendarDays, CircleUserRound, CreditCard, ExternalLink, LineChart, Menu, Moon, Settings, Sun, UtensilsCrossed, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminTheme } from "@/features/admin-panel/components/AdminThemeProvider";

type NavGroup = { title: string; links: Array<{ label: string; href: string }> };
const icons: Record<string, ComponentType<{ className?: string }>> = {
  today: CalendarDays, bookings: CalendarClock, customers: Users, menu: UtensilsCrossed,
  sales: LineChart, billing: CreditCard, settings: Settings, profile: CircleUserRound,
};

export function AdminNavigation({ tenant, role, groups, children }: { tenant: string; role: string; groups: NavGroup[]; children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useAdminTheme();
  const home = groups[0]?.links[0]?.href ?? `/admin/${tenant}/bookings`;
  const profileHref = `/admin/${tenant}/profile`;
  const settingsHref = `/admin/${tenant}/settings`;

  const sidebar = <>
    <div className="flex h-14 items-center gap-3 border-b border-border px-4">
      <Link href={home} className="flex items-center gap-2 text-base font-bold tracking-tight"><span className="grid size-8 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">M</span>Mesa</Link>
    </div>
    <nav aria-label="Workspace" className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
      {groups.map((group) => <section key={group.title}>
        <h2 className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group.title}</h2>
        <div className="space-y-0.5">{group.links.map((link) => {
          const active = pathname === link.href || (link.href.endsWith("/dashboard") && pathname === `/admin/${tenant}`);
          const Icon = icons[link.label.toLowerCase()] ?? CalendarDays;
          return <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} aria-current={active ? "page" : undefined} className={`flex min-h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition-colors ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon aria-hidden="true" className="size-4 shrink-0" />{link.label}</Link>;
        })}</div>
      </section>)}
    </nav>
    <div className="border-t border-border p-2"><a href={`/${tenant}`} target="_blank" rel="noreferrer" className="flex min-h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"><ExternalLink aria-hidden="true" className="size-4" />Public site</a></div>
  </>;

  return <div className="flex min-h-[calc(100vh-2.5rem)]">
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card md:flex">{sidebar}</aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-20 flex h-11 shrink-0 items-center justify-between border-b border-border bg-card px-2">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)} className="md:hidden"><Menu className="size-4" /></Button>
          <Link href={home} className="text-sm font-semibold md:hidden">Mesa</Link>
          <span className="hidden text-xs font-medium text-muted-foreground md:inline">{tenant}</span>
        </div>
        <nav aria-label="Account" className="flex items-center gap-0.5">
          <Button type="button" variant="ghost" size="icon" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}</Button>
          {role === "owner" && <Link href={settingsHref} aria-label="Settings" title="Settings" aria-current={pathname === settingsHref ? "page" : undefined} className={`grid size-8 place-items-center rounded-md ${pathname === settingsHref ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}><Settings aria-hidden="true" className="size-4" /></Link>}
          <Link href={profileHref} aria-label="Profile" title="Profile" aria-current={pathname === profileHref ? "page" : undefined} className={`grid size-8 place-items-center rounded-md ${pathname === profileHref ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}><CircleUserRound aria-hidden="true" className="size-4" /></Link>
        </nav>
      </header>
      {mobileOpen && <div className="fixed inset-x-0 bottom-0 top-11 z-30 flex md:hidden"><button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} /><aside className="relative flex w-64 flex-col border-r border-border bg-card shadow-xl">{sidebar}</aside></div>}
      {children}
    </div>
  </div>;
}
