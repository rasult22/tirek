import { test } from "node:test";
import assert from "node:assert/strict";

import {
  parseLanguage,
  pickInitialLanguage,
  shouldPersistToServer,
} from "./index.js";

// ─── parseLanguage ────────────────────────────────────────────────────

test('parseLanguage: returns "ru" for "ru"', () => {
  assert.equal(parseLanguage("ru"), "ru");
});

test('parseLanguage: returns "kz" for "kz"', () => {
  assert.equal(parseLanguage("kz"), "kz");
});

test("parseLanguage: returns null for unsupported language code", () => {
  assert.equal(parseLanguage("en"), null);
});

test("parseLanguage: returns null for null/undefined/non-string", () => {
  assert.equal(parseLanguage(null), null);
  assert.equal(parseLanguage(undefined), null);
  assert.equal(parseLanguage(42), null);
  assert.equal(parseLanguage({}), null);
});

// ─── pickInitialLanguage ──────────────────────────────────────────────

test("pickInitialLanguage: server value wins when valid (overwrites local)", () => {
  const result = pickInitialLanguage({
    server: { ok: true, language: "kz" },
    local: "ru",
    defaultLang: "ru",
  });
  assert.deepEqual(result, { language: "kz", writeLocal: true });
});

test("pickInitialLanguage: when server matches local, no localStorage write needed", () => {
  const result = pickInitialLanguage({
    server: { ok: true, language: "ru" },
    local: "ru",
    defaultLang: "ru",
  });
  assert.deepEqual(result, { language: "ru", writeLocal: false });
});

test("pickInitialLanguage: when server is unreachable (offline), keeps local value silently", () => {
  const result = pickInitialLanguage({
    server: { ok: false },
    local: "kz",
    defaultLang: "ru",
  });
  assert.deepEqual(result, { language: "kz", writeLocal: false });
});

test("pickInitialLanguage: server unreachable + no local value → defaults to defaultLang", () => {
  const result = pickInitialLanguage({
    server: { ok: false },
    local: null,
    defaultLang: "ru",
  });
  assert.deepEqual(result, { language: "ru", writeLocal: false });
});

test("pickInitialLanguage: server returns invalid value → falls back to local", () => {
  const result = pickInitialLanguage({
    server: { ok: true, language: "garbage" },
    local: "kz",
    defaultLang: "ru",
  });
  assert.deepEqual(result, { language: "kz", writeLocal: false });
});

test("pickInitialLanguage: invalid local value with server present → write server to local", () => {
  const result = pickInitialLanguage({
    server: { ok: true, language: "kz" },
    local: "garbage",
    defaultLang: "ru",
  });
  assert.deepEqual(result, { language: "kz", writeLocal: true });
});

test("pickInitialLanguage: invalid local + server unreachable → defaults", () => {
  const result = pickInitialLanguage({
    server: { ok: false },
    local: "garbage",
    defaultLang: "kz",
  });
  assert.deepEqual(result, { language: "kz", writeLocal: false });
});

// ─── shouldPersistToServer ────────────────────────────────────────────

test("shouldPersistToServer: true when current differs from desired", () => {
  assert.equal(shouldPersistToServer("ru", "kz"), true);
});

test("shouldPersistToServer: false when current equals desired", () => {
  assert.equal(shouldPersistToServer("ru", "ru"), false);
});

test("shouldPersistToServer: true when current is unknown", () => {
  assert.equal(shouldPersistToServer(null, "ru"), true);
  assert.equal(shouldPersistToServer(undefined, "ru"), true);
  assert.equal(shouldPersistToServer("garbage", "ru"), true);
});
