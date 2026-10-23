// Renders a public-site link that records click behavior without delaying navigation.
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackPublicUsage, type PublicUsageEvent } from "@/features/usage/components/UsagePing";

export function TrackedLink({ href, tenant, event, children, className }: { href: string; tenant: string; event: PublicUsageEvent; children: ReactNode; className?: string }) {
  return <Link href={href} onClick={() => trackPublicUsage(tenant, event)} className={className}>{children}</Link>;
}
