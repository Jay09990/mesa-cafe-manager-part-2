// Trial-only billing view; checkout remains paused during the pilot.
import { notFound } from "next/navigation";
import { requireTenantRole } from "@/features/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function BillingPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params;
  const access = await requireTenantRole(slug, ["owner"]);
  if (!access) notFound();
  const tenant = await prisma.tenant.findUnique({ where: { id: access.tenantId }, select: { subscriptionStatus: true, trialEndsAt: true, timezone: true } });
  if (!tenant) notFound();
  const endDate = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: tenant.timezone }).format(tenant.trialEndsAt);
  const expired = tenant.subscriptionStatus === "trial" && Date.now() > tenant.trialEndsAt.getTime();
  return <section className="max-w-2xl rounded-lg border border-neutral-200 bg-white p-6"><h1 className="text-2xl font-semibold">Billing</h1><p className="mt-4">{tenant.subscriptionStatus === "trial" ? expired ? `Your free trial ended on ${endDate}. Your access remains available while we review the pilot.` : `Your café is on a free trial until ${endDate}.` : `Current status: ${tenant.subscriptionStatus}.`}</p></section>;
}
