// Produces Excel-friendly UTF-8 CSV with quoted and escaped cells.
// Mitigates CSV formula injection (CWE-1236) by prefixing dangerous characters with a single quote.
const FORMULA_INJECTION_PREFIXES = /^[=+\-@\t\r]/;

export function toCsv(rows: Array<Array<string | number | null | undefined>>) {
  const body = rows.map((row) => row.map((cell) => {
    if (cell === null || cell === undefined) return '""';
    const raw = String(cell);
    // Prefix formula trigger characters so spreadsheet applications treat values strictly as text.
    const safe = typeof cell === "string" && FORMULA_INJECTION_PREFIXES.test(raw) ? `'${raw}` : raw;
    return `"${safe.replaceAll('"', '""')}"`;
  }).join(",")).join("\r\n");
  return `\uFEFF${body}`;
}
