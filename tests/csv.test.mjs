import test from "node:test";
import assert from "node:assert/strict";
import { toCsv } from "../lib/csv.ts";

test("CSV includes a UTF-8 BOM and escapes quotes and commas", () => {
  assert.equal(toCsv([["name", "note"], ["Mesa", 'A "good", café']]), '\uFEFF"name","note"\r\n"Mesa","A ""good"", café"');
});
