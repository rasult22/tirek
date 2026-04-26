import { test } from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";

import { createTirekClient, ApiError } from "@tirek/shared/api";
import type { MoodEntry } from "@tirek/shared";

/**
 * Integration-тесты shared API client'а против in-process Hono backend.
 * Цель: проверить, что client формирует правильные HTTP-запросы (URL, method, headers, body)
 * и корректно парсит ответы — то есть, contract client↔backend.
 *
 * Почему backend, а не mock fetch: тестовая Hono-инстанция даёт настоящий fetch-loop
 * (запрос → middleware → handler → response → парсинг), без mock'а самого fetch'а.
 */

function makeBackend() {
  const app = new Hono();
  const calls: Array<{
    method: string;
    path: string;
    auth: string | null;
    body: unknown;
  }> = [];

  app.post("/student/mood", async (c) => {
    calls.push({
      method: "POST",
      path: "/student/mood",
      auth: c.req.header("Authorization") ?? null,
      body: await c.req.json().catch(() => null),
    });
    const entry: MoodEntry = {
      id: "m1",
      userId: "u1",
      mood: 3,
      energy: null,
      sleepQuality: null,
      stressLevel: null,
      note: null,
      factors: null,
      createdAt: "2026-04-26T10:00:00.000Z",
    };
    return c.json(entry, 201);
  });

  return { app, calls };
}

function makeFetch(app: Hono): typeof fetch {
  // Hono.fetch принимает Request, возвращает Response | Promise<Response>;
  // оборачиваем в Promise.resolve, чтобы получить drop-in fetch с Promise<Response>.
  return (input, init) =>
    Promise.resolve(
      app.fetch(
        new Request(typeof input === "string" ? input : input.toString(), init),
      ),
    );
}

test("tracer: client.mood.create отправляет POST /student/mood и парсит MoodEntry", async () => {
  const { app, calls } = makeBackend();
  const client = createTirekClient({
    baseUrl: "http://test",
    getToken: () => "tok",
    fetch: makeFetch(app),
  });

  const result = await client.mood.create({ mood: 3 });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].path, "/student/mood");
  assert.deepEqual(calls[0].body, { mood: 3 });
  assert.equal(result.id, "m1");
  assert.equal(result.mood, 3);
});

test("getToken: токен подставляется в Authorization Bearer перед каждым запросом", async () => {
  const { app, calls } = makeBackend();
  const tokens = ["t1", "t2"];
  const client = createTirekClient({
    baseUrl: "http://test",
    getToken: () => tokens.shift() ?? null,
    fetch: makeFetch(app),
  });

  await client.mood.create({ mood: 3 });
  await client.mood.create({ mood: 4 });

  assert.equal(calls[0].auth, "Bearer t1");
  assert.equal(calls[1].auth, "Bearer t2");
});

test("getToken: если токен null — Authorization header не отправляется", async () => {
  const { app, calls } = makeBackend();
  const client = createTirekClient({
    baseUrl: "http://test",
    getToken: () => null,
    fetch: makeFetch(app),
  });

  await client.mood.create({ mood: 3 });

  assert.equal(calls[0].auth, null);
});

test("getToken: поддерживается async (Promise<string | null>)", async () => {
  const { app, calls } = makeBackend();
  const client = createTirekClient({
    baseUrl: "http://test",
    getToken: async () => "async-tok",
    fetch: makeFetch(app),
  });

  await client.mood.create({ mood: 3 });

  assert.equal(calls[0].auth, "Bearer async-tok");
});

test("401: вызывается onUnauthorized и бросается ApiError(401)", async () => {
  const app = new Hono();
  app.post("/student/mood", (c) => c.json({ error: "expired", code: "UNAUTHORIZED" }, 401));

  let unauthorizedCalls = 0;
  const client = createTirekClient({
    baseUrl: "http://test",
    getToken: () => "stale-token",
    fetch: makeFetch(app),
    onUnauthorized: () => {
      unauthorizedCalls++;
    },
  });

  const err = await client.mood.create({ mood: 3 }).then(
    () => null,
    (e: unknown) => e,
  );

  assert.ok(err instanceof ApiError, "ожидался ApiError");
  assert.equal((err as ApiError).status, 401);
  assert.equal(unauthorizedCalls, 1);
});

test("401 без onUnauthorized: всё равно бросается ApiError, без падений", async () => {
  const app = new Hono();
  app.post("/student/mood", (c) => c.json({ error: "expired", code: "UNAUTHORIZED" }, 401));

  const client = createTirekClient({
    baseUrl: "http://test",
    getToken: () => "stale",
    fetch: makeFetch(app),
  });

  const err = await client.mood.create({ mood: 3 }).then(
    () => null,
    (e: unknown) => e,
  );

  assert.ok(err instanceof ApiError);
  assert.equal((err as ApiError).status, 401);
});

test("error mapping: не-2xx → ApiError со status, code и error из тела", async () => {
  const app = new Hono();
  app.post("/student/mood", (c) =>
    c.json({ error: "Mood must be 1-5", code: "VALIDATION_ERROR" }, 400),
  );

  const client = createTirekClient({
    baseUrl: "http://test",
    getToken: () => "tok",
    fetch: makeFetch(app),
  });

  const err = await client.mood.create({ mood: 99 }).then(
    () => null,
    (e: unknown) => e,
  );

  assert.ok(err instanceof ApiError);
  assert.equal((err as ApiError).status, 400);
  assert.equal((err as ApiError).code, "VALIDATION_ERROR");
  assert.equal((err as ApiError).message, "Mood must be 1-5");
});

test("psychologist namespace: students.list с фильтрами сериализует query string", async () => {
  const app = new Hono();
  let capturedUrl: string | null = null;
  app.get("/psychologist/students", (c) => {
    capturedUrl = c.req.url;
    return c.json({
      data: [],
      pagination: { limit: 100, offset: 0, total: 0, hasMore: false },
    });
  });

  const client = createTirekClient({
    baseUrl: "http://test",
    getToken: () => "psy-tok",
    fetch: makeFetch(app),
  });

  await client.psychologist.students.list({ search: "Алия", grade: 9, classLetter: "Б" });

  assert.ok(capturedUrl !== null);
  const url = new URL(capturedUrl!);
  assert.equal(url.pathname, "/psychologist/students");
  assert.equal(url.searchParams.get("search"), "Алия");
  assert.equal(url.searchParams.get("grade"), "9");
  assert.equal(url.searchParams.get("classLetter"), "Б");
  assert.equal(url.searchParams.get("limit"), "100");
});

test("error mapping: тело без code/error → дефолты UNKNOWN", async () => {
  const app = new Hono();
  app.post("/student/mood", (c) => c.body("plain text crash", 500));

  const client = createTirekClient({
    baseUrl: "http://test",
    getToken: () => "tok",
    fetch: makeFetch(app),
  });

  const err = await client.mood.create({ mood: 3 }).then(
    () => null,
    (e: unknown) => e,
  );

  assert.ok(err instanceof ApiError);
  assert.equal((err as ApiError).status, 500);
  assert.equal((err as ApiError).code, "UNKNOWN");
  assert.equal((err as ApiError).message, "Unknown error");
});
