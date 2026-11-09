// Validates scheduled cron request secrets using constant-time comparison.
import { createHash, timingSafeEqual } from "node:crypto";

// Security: Prevent timing attacks (CWE-208 / CWE-385) by comparing SHA-256 digested
// strings with timingSafeEqual. Digestion ensures equal buffer length and avoids leaking
// token length or prefix matches.
export function isValidCronSecret(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const expected = createHash("sha256").update(`Bearer ${secret}`).digest();
  const actual = createHash("sha256").update(header).digest();
  return timingSafeEqual(expected, actual);
}
