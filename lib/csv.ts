// Produces Excel-friendly UTF-8 CSV with quoted and escaped cells.
// Security: Neutralizes CSV Injection (Formula Injection, CWE-1236) by prefixing
// string cells starting with formula triggers (=, +, -, @, \t, \r) with a single quote.
export function toCsv(rows: Array<Array<string | number | null | undefined>>) {
  const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
  const body = rows.map((row) => row.map((cell) => {
    if (cell === null || cell === undefined) return '""';
    if (typeof cell === "number") return `"${cell}"`;
    const str = String(cell);
    const sanitized = FORMULA_TRIGGER.test(str) ? `'${str}` : str;
    return `"${sanitized.replaceAll('"', '""')}"`;
  }).join(",")).join("\r\n");
  return `\uFEFF${body}`;
}
