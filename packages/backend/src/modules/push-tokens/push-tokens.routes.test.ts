process.env.JWT_SECRET ??= "test-secret-must-be-at-least-32-characters-long";

import { test } from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";

import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import type { JwtPayload } from "../../lib/jwt.js";
import {
  createPushTokensService,
  type PushTokenRecord,
  type PushTokensDeps,
} from "./push-tokens.factory.js";
import { createPushTokensRouter } from "./push-tokens.routes.factory.js";

type Fakes = { rows: PushTokenRecord[] };

function makeApp(opts: { user?: JwtPayload; seed?: PushTokenRecord[] } = {}) {
  const fakes: Fakes = { rows: opts.seed ? [...opts.seed] : [] };

  const deps: PushTokensDeps = {
    upsert: async ({ token, userId, platform, now }) => {
      const existing = fakes.rows.find((r) => r.token === token);
      if (existing) {
        existing.userId = userId;
        existing.platform = platform;
        existing.lastSeenAt = now;
        return existing;
      }
      const row: PushTokenRecord = {
        token,
        userId,
        platform,
        createdAt: now,
        lastSeenAt: now,
      };
      fakes.rows.push(row);
      return row;
    },
    findByUserId: async (userId) =>
      fakes.rows.filter((r) => r.userId === userId),
    deleteByToken: async (token) => {
      const idx = fakes.rows.findIndex((r) => r.token === token);
      if (idx >= 0) fakes.rows.splice(idx, 1);
      return idx >= 0;
    },
  };

  const service = createPushTokensService(deps);
  const router = createPushTokensRouter(service);

  const app = new Hono<{ Variables: AppVariables }>();
  app.use("*", async (c, next) => {
    if (opts.user) c.set("user", opts.user);
    await next();
  });
  app.route("/student/push-token", router);
  app.route("/psychologist/push-token", router);
  app.onError((err, c) => handleError(c, err));

  return { app, fakes };
}

function student(userId = "stu-1"): JwtPayload {
  return { userId, email: `${userId}@test`, role: "student" };
}

function psy(userId = "psy-1"): JwtPayload {
  return { userId, email: `${userId}@test`, role: "psychologist" };
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

test("POST /student/push-token — 201 + сохраняет с user'ом из JWT", async () => {
  const { app, fakes } = makeApp({ user: student("stu-42") });

  const res = await app.fetch(
    new Request("http://localhost/student/push-token", {
      ...jsonInit("POST", { token: "ExpoPushToken[abc]", platform: "ios" }),
    }),
  );

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.token, "ExpoPushToken[abc]");
  assert.equal(fakes.rows.length, 1);
  assert.equal(fakes.rows[0]!.userId, "stu-42");
  assert.equal(fakes.rows[0]!.platform, "ios");
});

test("POST /psychologist/push-token — 201, тот же router работает для психолога", async () => {
  const { app, fakes } = makeApp({ user: psy("psy-1") });

  const res = await app.fetch(
    new Request("http://localhost/psychologist/push-token", {
      ...jsonInit("POST", { token: "ExpoPushToken[xyz]", platform: "android" }),
    }),
  );

  assert.equal(res.status, 201);
  assert.equal(fakes.rows[0]!.userId, "psy-1");
});

test("POST /student/push-token с невалидной platform → 400", async () => {
  const { app } = makeApp({ user: student() });

  const res = await app.fetch(
    new Request("http://localhost/student/push-token", {
      ...jsonInit("POST", { token: "ExpoPushToken[abc]", platform: "BlackBerry" }),
    }),
  );

  assert.equal(res.status, 400);
});

test("POST /student/push-token с пустым token → 400", async () => {
  const { app } = makeApp({ user: student() });

  const res = await app.fetch(
    new Request("http://localhost/student/push-token", {
      ...jsonInit("POST", { token: "", platform: "ios" }),
    }),
  );

  assert.equal(res.status, 400);
});

test("DELETE /student/push-token/:token — удаляет токен", async () => {
  const { app, fakes } = makeApp({
    user: student("stu-1"),
    seed: [
      {
        token: "T1",
        userId: "stu-1",
        platform: "ios",
        createdAt: new Date(),
        lastSeenAt: new Date(),
      },
    ],
  });

  const res = await app.fetch(
    new Request("http://localhost/student/push-token/T1", { method: "DELETE" }),
  );

  assert.equal(res.status, 200);
  assert.equal(fakes.rows.length, 0);
});
