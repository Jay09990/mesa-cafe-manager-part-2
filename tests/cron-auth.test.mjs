import assert from "node:assert/strict";
import test from "node:test";
import { isValidCronSecret } from "../lib/cron-auth.ts";

test("isValidCronSecret validates authorization header in constant time", () => {
  const secret = "production-cron-secret-xyz-12345";

  // Returns true when Bearer token matches CRON_SECRET
  assert.equal(isValidCronSecret(`Bearer ${secret}`, secret), true);

  // Returns false when token is incorrect
  assert.equal(isValidCronSecret("Bearer wrong-secret", secret), false);

  // Returns false when prefix is missing
  assert.equal(isValidCronSecret(secret, secret), false);

  // Returns false for null or undefined headers
  assert.equal(isValidCronSecret(null, secret), false);

  // Returns false when secret is empty or undefined
  assert.equal(isValidCronSecret(`Bearer ${secret}`, ""), false);
  assert.equal(isValidCronSecret(`Bearer ${secret}`, undefined), false);

  // Safe against timing attack variations and different input lengths
  assert.equal(isValidCronSecret("Bearer ", secret), false);
  assert.equal(isValidCronSecret("Bearer p", secret), false);
  assert.equal(isValidCronSecret(`Bearer ${secret}extra`, secret), false);
});
