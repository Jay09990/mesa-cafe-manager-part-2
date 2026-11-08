// Verifies cron authentication headers in constant time to prevent timing attacks.
import { timingSafeEqual } from "node:crypto";

/**
 * Verifies the Bearer token in constant time to prevent timing side-channel attacks (CWE-208 / CWE-385).
 */
export function isAuthorizedCronRequest(authHeader: string | null | undefined, secret: string | undefined): boolean {
  if (!secret || !authHeader) return false;
  const expected = `Bearer ${secret}`;
  const headerBuf = Buffer.from(authHeader);
  const expectedBuf = Buffer.from(expected);
  if (headerBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(headerBuf, expectedBuf);
}
