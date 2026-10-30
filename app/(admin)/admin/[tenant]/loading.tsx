export default function AdminLoading() {
  return <div role="status" aria-live="polite" className="mx-auto max-w-7xl p-5 text-sm text-neutral-600">
    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 align-[-3px]" aria-hidden="true" />
    Loading your café workspace…
  </div>;
}
