// Produces Excel-friendly UTF-8 CSV with quoted and escaped cells.
export function toCsv(rows: Array<Array<string | number | null | undefined>>) {
  const body = rows.map((row) => row.map((cell) => {
    const value = cell === null || cell === undefined ? "" : String(cell);
    return `"${value.replaceAll('"', '""')}"`;
  }).join(",")).join("\r\n");
  return `\uFEFF${body}`;
}
