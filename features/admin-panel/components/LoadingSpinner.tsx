// Small, consistent progress indicator for actions that start after first render.
export function LoadingSpinner({ label }: { label?: string }) {
  return <span className="inline-flex items-center gap-2" role={label ? "status" : undefined}>
    <span aria-hidden="true" className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent align-[-3px]" />
    {label && <span>{label}</span>}
  </span>;
}
