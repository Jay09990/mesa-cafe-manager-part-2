// Persists small, tenant-scoped events used to evaluate trial feature adoption.
import { prisma } from "@/lib/prisma";

export type UsageEventType =
  | "menu_view"
  | "book_click"
  | "booking_started"
  | "booking_created"
  | "booking_status_changed"
  | "dashboard_opened"
  | "sales_log_saved"
  | "menu_item_edited"
  | "menu_item_toggled"
  | "day_end_email_sent";

export async function trackEvent(input: {
  tenantId: string;
  type: UsageEventType;
  userId?: string;
  meta?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  await prisma.usageEvent.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      type: input.type,
      meta: input.meta,
    },
  });
}
