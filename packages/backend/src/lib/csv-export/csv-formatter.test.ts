import { test } from 'node:test';
import assert from 'node:assert/strict';

import { csvRow, csvFile } from './csv-formatter.js';

test('csvRow_joins_plain_cells_with_commas_unquoted', () => {
  assert.equal(csvRow(['a', 'b', 'c']), 'a,b,c');
});

test('csvRow_wraps_cell_containing_comma_in_double_quotes', () => {
  assert.equal(csvRow(['Smith, John', 'OK']), '"Smith, John",OK');
});

test('csvRow_doubles_internal_quotes_and_wraps_cell', () => {
  assert.equal(csvRow(['He said "hi"', 'b']), '"He said ""hi""",b');
});

test('csvRow_wraps_cell_with_embedded_newline_in_quotes', () => {
  assert.equal(csvRow(['line1\nline2', 'b']), '"line1\nline2",b');
});

test('csvRow_renders_null_and_undefined_as_empty_cells', () => {
  assert.equal(csvRow([null, undefined, 'x']), ',,x');
});

test('csvRow_renders_numbers_via_string_coercion', () => {
  assert.equal(csvRow([1, 2.5, 0]), '1,2.5,0');
});

test('csvFile_prefixes_output_with_utf8_bom', () => {
  const out = csvFile(['a,b', 'c,d']);
  assert.equal(out.charCodeAt(0), 0xfeff);
});

test('csvFile_joins_rows_with_crlf', () => {
  assert.equal(csvFile(['a,b', 'c,d']), '﻿a,b\r\nc,d');
});

test('csvFile_returns_only_bom_for_empty_rows', () => {
  assert.equal(csvFile([]), '﻿');
});
