import test from "node:test";
import assert from "node:assert/strict";
import { isAuthorizedCronRequest } from "../lib/cron-auth.ts";

test("isAuthorizedCronRequest authorizes matching Bearer token in constant time", () => {
  const secret = "correct-horse-battery-staple-12345";
  assert.equal(isAuthorizedCronRequest(`Bearer ${secret}`, secret), true);
});

test("isAuthorizedCronRequest rejects missing or undefined secret or header", () => {
  assert.equal(isAuthorizedCronRequest(null, "secret123"), false);
  assert.equal(isAuthorizedCronRequest(undefined, "secret123"), false);
  assert.equal(isAuthorizedCronRequest("Bearer secret123", undefined), false);
  assert.equal(isAuthorizedCronRequest("Bearer secret123", ""), false);
  assert.equal(isAuthorizedCronRequest("", "secret123"), false);
});

test("isAuthorizedCronRequest rejects non-matching tokens of same length safely", () => {
  const secret = "secret123";
  const wrongSecret = "secret999";
  assert.equal(isAuthorizedCronRequest(`Bearer ${wrongSecret}`, secret), false);
});

test("isAuthorizedCronRequest rejects tokens of differing length safely without throwing", () => {
  const secret = "secret123";
  assert.equal(isAuthorizedCronRequest("Bearer short", secret), false);
  assert.equal(isAuthorizedCronRequest("Bearer this-is-a-much-longer-token-attempt", secret), false);
  assert.equal(isAuthorizedCronRequest("Basic secret123", secret), false);
});
