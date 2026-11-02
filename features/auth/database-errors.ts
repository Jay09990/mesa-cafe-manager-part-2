const TRANSIENT_PRISMA_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

export function isTransientDatabaseFailure(error: unknown): boolean {
  const pending: unknown[] = [error];
  const seen = new Set<object>();
  while (pending.length) {
    const current = pending.pop();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);

    const record = current as Record<string, unknown>;
    if (typeof record.code === "string" && TRANSIENT_PRISMA_CODES.has(record.code)) return true;
    if (record.name === "PrismaClientInitializationError") return true;
    if (typeof record.message === "string" && /can't reach database server|timed? out fetching a new connection|connection pool timeout/i.test(record.message)) return true;
    pending.push(record.cause, record.body && typeof record.body === "object" ? (record.body as Record<string, unknown>).cause : undefined);
  }
  return false;
}
