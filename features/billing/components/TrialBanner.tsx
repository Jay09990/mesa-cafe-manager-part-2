// Shows trial end information without locking or restricting access.
export function TrialBanner({ trialEndsAt, timezone, status }: { trialEndsAt: Date; timezone: string; status: string }) {
  if (status !== "trial") return null;
  const endDate = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: timezone }).format(trialEndsAt);
  const expired = Date.now() > trialEndsAt.getTime();
  return <aside className="border-b border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-700" role="status">
    {expired ? `Your trial ended on ${endDate}. Your Mesa access is still available.` : `Free trial · Ends ${endDate}`}
  </aside>;
}
