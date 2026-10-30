export default function CafePageLoading() {
  return <div role="status" aria-live="polite" className="mx-auto max-w-5xl px-5 py-16 text-sm text-[var(--public-text-muted)]">
    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 align-[-3px]" aria-hidden="true" />
    Loading café information…
  </div>;
}
