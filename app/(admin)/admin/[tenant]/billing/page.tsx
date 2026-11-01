// Trial-only billing view; checkout remains paused during the pilot.
import { notFound } from "next/navigation";
import { requireTenantRole } from "@/features/auth/guards";

export default async function BillingPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const access = await requireTenantRole(slug, ["owner"]);
  if (!access) notFound();
  const tenant = access.tenant;
  const endDate = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: tenant.timezone }).format(tenant.trialEndsAt);
  const expired = tenant.subscriptionStatus === "trial" && Date.now() > tenant.trialEndsAt.getTime();
  return <section className="w-full rounded-lg border border-border bg-card p-3"><h1 className="text-xl font-semibold">Billing</h1><p className="mt-2">{tenant.subscriptionStatus === "trial" ? expired ? `Your free trial ended on ${endDate}. Your access remains available while we review the pilot.` : `Your café is on a free trial until ${endDate}.` : `Current status: ${tenant.subscriptionStatus}.`}</p></section>;
}
