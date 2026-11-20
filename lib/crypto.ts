// Security utility functions for authentication and authorization checks.
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time bearer token check to prevent timing attacks on secrets like CRON_SECRET.
 * Hashing both values to SHA-256 guarantees equal length buffers for timingSafeEqual.
 */
export function isAuthorizedBearer(authHeader: string | null | undefined, secret: string | undefined): boolean {
  if (!secret || !authHeader) return false;
  const expectedHeader = `Bearer ${secret}`;
  const actualHash = createHash("sha256").update(authHeader).digest();
  const expectedHash = createHash("sha256").update(expectedHeader).digest();
  return timingSafeEqual(actualHash, expectedHash);
}
