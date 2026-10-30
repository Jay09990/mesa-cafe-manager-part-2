import test from "node:test";
import assert from "node:assert/strict";
import { isSalesDateAllowed, salesLogSchema } from "../features/sales-log/service.ts";

test("accepts non-negative payment amounts with at most two decimals", () => {
  const parsed = salesLogSchema.safeParse({ ordersCount: 12, cash: 100.25, upi: 80, card: 0, other: 1.5 });
  assert.equal(parsed.success, true);
});

test("rejects fractional order counts, negative amounts, and excess precision", () => {
  assert.equal(salesLogSchema.safeParse({ ordersCount: 1.5, cash: 1, upi: 0, card: 0, other: 0 }).success, false);
  assert.equal(salesLogSchema.safeParse({ ordersCount: 1, cash: -1, upi: 0, card: 0, other: 0 }).success, false);
  assert.equal(salesLogSchema.safeParse({ ordersCount: 1, cash: 1.001, upi: 0, card: 0, other: 0 }).success, false);
});

test("sales dates use the tenant's local calendar day", () => {
  const now = new Date("2026-10-24T19:00:00.000Z");
  assert.equal(isSalesDateAllowed("2026-10-25", "Asia/Kolkata", now), true);
  assert.equal(isSalesDateAllowed("2026-10-26", "Asia/Kolkata", now), false);
});
