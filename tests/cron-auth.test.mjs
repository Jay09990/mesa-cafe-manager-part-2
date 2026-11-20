import assert from "node:assert/strict";
import test from "node:test";
import { isAuthorizedBearer } from "../lib/crypto.ts";

test("isAuthorizedBearer authorizes identical bearer token", () => {
  const secret = "super-secret-cron-token-12345";
  const header = `Bearer ${secret}`;
  assert.equal(isAuthorizedBearer(header, secret), true);
});

test("isAuthorizedBearer rejects missing header or secret", () => {
  const secret = "super-secret-cron-token-12345";
  assert.equal(isAuthorizedBearer(null, secret), false);
  assert.equal(isAuthorizedBearer(undefined, secret), false);
  assert.equal(isAuthorizedBearer("", secret), false);
  assert.equal(isAuthorizedBearer(`Bearer ${secret}`, undefined), false);
  assert.equal(isAuthorizedBearer(`Bearer ${secret}`, ""), false);
});

test("isAuthorizedBearer rejects token with different character or length", () => {
  const secret = "super-secret-cron-token-12345";
  assert.equal(isAuthorizedBearer("Bearer wrong-token", secret), false);
  assert.equal(isAuthorizedBearer(`Bearer ${secret.slice(0, -1)}`, secret), false);
  assert.equal(isAuthorizedBearer(`Bearer ${secret}extra`, secret), false);
  assert.equal(isAuthorizedBearer(`Basic ${secret}`, secret), false);
});
