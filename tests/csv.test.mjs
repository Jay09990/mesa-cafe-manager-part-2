import test from "node:test";
import assert from "node:assert/strict";
import { toCsv } from "../lib/csv.ts";

test("CSV includes a UTF-8 BOM and escapes quotes and commas", () => {
  assert.equal(toCsv([["name", "note"], ["Mesa", 'A "good", café']]), '\uFEFF"name","note"\r\n"Mesa","A ""good"", café"');
});

test("CSV neutralizes formula injection triggers for string cells", () => {
  const result = toCsv([
    ["formula", "quotes", "plus", "minus", "at", "tab", "carriage_return", "safe_number"],
    ["=1+1", '="evil"', "+12345", "-@calc", "@SUM(1,2)", "\talert", "\rcarriage", -42],
  ]);
  assert.equal(
    result,
    '\uFEFF"formula","quotes","plus","minus","at","tab","carriage_return","safe_number"\r\n"\'=1+1","\'=\"\"evil\"\"","\'+12345","\'-@calc","\'@SUM(1,2)","\'\talert","\'\rcarriage","-42"',
  );
});
