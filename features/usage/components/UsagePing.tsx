// Sends public product usage events without blocking navigation or rendering.
"use client";

import { useEffect } from "react";

export type PublicUsageEvent = "menu_view" | "book_click" | "booking_started";

export function UsagePing({ tenant, event }: { tenant: string; event: PublicUsageEvent }) {
  useEffect(() => {
    void fetch(`/api/usage?tenant=${encodeURIComponent(tenant)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event }),
      keepalive: true,
    }).catch(() => undefined);
  }, [tenant, event]);
  return null;
}

export function trackPublicUsage(tenant: string, event: PublicUsageEvent) {
  void fetch(`/api/usage?tenant=${encodeURIComponent(tenant)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => undefined);
}
