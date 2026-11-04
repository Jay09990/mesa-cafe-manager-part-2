import test from "node:test";
import assert from "node:assert/strict";
import { toCsv } from "../lib/csv.ts";

test("CSV includes a UTF-8 BOM and escapes quotes and commas", () => {
  assert.equal(toCsv([["name", "note"], ["Mesa", 'A "good", café']]), '\uFEFF"name","note"\r\n"Mesa","A ""good"", café"');
});

test("CSV sanitizes formula trigger characters to prevent CSV injection (CWE-1236)", () => {
  const result = toCsv([
    ["field", "payload"],
    ["formula", '=cmd|" /C calc"!A0'],
    ["plus", "+123456"],
    ["minus_formula", "-SUM(A1:A2)"],
    ["at_sign", "@SUM(1+1)"],
    ["tab", "\t=calc"],
    ["carriage_return", "\r=calc"],
    ["safe_number", -42],
    ["safe_float", 3.14],
    ["safe_null", null],
    ["safe_undefined", undefined],
  ]);

  assert.equal(
    result,
    '\uFEFF"field","payload"\r\n' +
    '"formula","\'=cmd|"" /C calc""!A0"\r\n' +
    '"plus","\'+123456"\r\n' +
    '"minus_formula","\'-SUM(A1:A2)"\r\n' +
    '"at_sign","\'@SUM(1+1)"\r\n' +
    '"tab","\'\t=calc"\r\n' +
    '"carriage_return","\'\r=calc"\r\n' +
    '"safe_number","-42"\r\n' +
    '"safe_float","3.14"\r\n' +
    '"safe_null",""\r\n' +
    '"safe_undefined",""'
  );
});
