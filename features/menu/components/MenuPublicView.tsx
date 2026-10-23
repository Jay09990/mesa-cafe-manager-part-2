// Renders the full menu with sold-out status and optional dietary labels.
import type { MenuItem } from "@prisma/client";

const DIETARY_LABELS: Record<string, string> = { veg: "Vegetarian", non_veg: "Non-vegetarian", egg: "Contains egg" };

export function groupMenuByCategory(items: MenuItem[]) {
  const groups = new Map<string, MenuItem[]>();
  for (const item of [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))) {
    const group = groups.get(item.category) ?? [];
    group.push(item);
    groups.set(item.category, group);
  }
  return [...groups.entries()];
}

export function MenuPublicView({ items, currency }: { items: MenuItem[]; currency: string }) {
  const groups = groupMenuByCategory(items);
  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency });
  if (!groups.length) return <p className="rounded-lg border border-[var(--public-border)] bg-[var(--public-surface)] p-5">The menu is being updated. Please check back soon.</p>;
  return <div className="space-y-8">{groups.map(([category, entries]) => <section key={category}><h2 className="mb-3 text-xl font-semibold">{category}</h2><ul className="grid gap-4 sm:grid-cols-2">{entries.map((item) => <li key={item.id} className="flex gap-4 rounded-xl border border-[var(--public-border)] bg-[var(--public-surface)] p-4">{item.imageUrl && <img src={item.imageUrl} alt="" className="h-24 w-24 rounded-lg object-cover" />}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold">{item.name}</h3><span className="font-medium">{money.format(Number(item.price))}</span></div>{item.description && <p className="mt-1 text-sm text-[var(--public-text-muted)]">{item.description}</p>}<div className="mt-3 flex flex-wrap gap-2">{item.dietaryType && <span className="rounded-full border border-[var(--public-border)] px-2 py-1 text-xs">{DIETARY_LABELS[item.dietaryType] ?? ""}</span>}{!item.available && <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium">Sold out</span>}</div></div></li>)}</ul></section>)}</div>;
}
