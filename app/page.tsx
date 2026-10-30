// Mesa's platform home for café owners before they open a tenant-specific site.
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--public-background)] text-[var(--public-text)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Link href="/" className="text-xl font-semibold tracking-tight">Mesa</Link>
        <nav aria-label="Account" className="flex items-center gap-2">
          <Link href="/sign-in" className="min-h-11 rounded-md px-4 py-3 text-sm font-medium hover:bg-neutral-100">Sign in</Link>
          <Link href="/sign-up" className="min-h-11 rounded-md bg-[var(--public-primary)] px-4 py-3 text-sm font-semibold text-white">Get started</Link>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[70vh] max-w-6xl content-center gap-10 px-5 py-16 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--public-text-muted)]">A simpler way to run your café</p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">Your café website, bookings, and daily numbers in one place.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--public-text-muted)]">Keep your menu up to date, take table bookings, and see how each day is going with Mesa.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up" className="inline-flex min-h-12 items-center rounded-md bg-[var(--public-primary)] px-6 font-semibold text-white">Start your free trial</Link>
            <Link href="/sign-in" className="inline-flex min-h-12 items-center rounded-md border border-[var(--public-border)] bg-[var(--public-surface)] px-6 font-semibold">Sign in to Mesa</Link>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-[var(--public-text-muted)]">Made for the everyday work</p>
          <ul className="mt-5 space-y-5">
            <li><h2 className="font-semibold">Bookings</h2><p className="mt-1 text-sm leading-6 text-[var(--public-text-muted)]">Let guests request a visit and keep every booking together.</p></li>
            <li><h2 className="font-semibold">Menu</h2><p className="mt-1 text-sm leading-6 text-[var(--public-text-muted)]">Share your dishes, prices, photos, and what is sold out.</p></li>
            <li><h2 className="font-semibold">Today’s numbers</h2><p className="mt-1 text-sm leading-6 text-[var(--public-text-muted)]">Log daily sales and review a clear summary for your café.</p></li>
          </ul>
        </div>
      </section>

      <footer className="border-t border-[var(--public-border)] px-5 py-6 text-center text-sm text-[var(--public-text-muted)]">Mesa · Café management made clear</footer>
    </main>
  );
}
