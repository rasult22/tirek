import { test } from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";

import { createPasswordResetService } from "./password-reset.service.js";
import type {
  PasswordResetServiceDeps,
  PersistedResetCode,
} from "./password-reset.service.js";
import { handleError } from "../../shared/errors.js";

// Smoke-тест http-контракта эндпоинтов восстановления пароля через in-process Hono.
// Цель: проверить, что роуты подключаются, тело запроса/ответа соответствует контракту,
// и нужные ошибки маппятся через handleError. Service-логика покрыта в *.service.test.ts.

function makeApp() {
  const codes: PersistedResetCode[] = [];
  const usersDb = [
    {
      id: "user-1",
      email: "alia@school.kz",
      passwordHash: "hashed-pw:old",
      name: "Алия",
      role: "student",
      language: "ru",
      avatarId: null,
      grade: 9,
      classLetter: "Б",
      schoolId: null,
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
    },
  ];
  const emailsSent: Array<{ email: string; code: string }> = [];
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");

  const deps: PasswordResetServiceDeps = {
    findUserByEmail: async (email) =>
      usersDb.find((u) => u.email === email) ?? null,
    invalidateActiveCodesForUser: async (userId, when) => {
      for (const c of codes) {
        if (c.userId === userId && c.usedAt === null) c.usedAt = when;
      }
    },
    countRecentCodesForUser: async () => 0,
    findLatestCodeForUser: async () => null,
    findActiveCodeForUser: async (userId, when) =>
      codes.find(
        (c) => c.userId === userId && c.usedAt === null && c.expiresAt > when,
      ) ?? null,
    insertCode: async (data) => {
      const row: PersistedResetCode = {
        id: data.id,
        userId: data.userId,
        codeHash: data.codeHash,
        expiresAt: data.expiresAt,
        usedAt: null,
        attempts: 0,
        createdAt: data.createdAt,
      };
      codes.push(row);
      return row;
    },
    incrementAttempts: async (codeId) => {
      const c = codes.find((x) => x.id === codeId);
      if (c) c.attempts += 1;
      return c ?? null;
    },
    markCodeUsed: async (codeId, when) => {
      const c = codes.find((x) => x.id === codeId);
      if (c) c.usedAt = when;
    },
    updateUserPassword: async (userId, passwordHash) => {
      const u = usersDb.find((x) => x.id === userId);
      if (u) u.passwordHash = passwordHash;
    },
    sendResetCodeEmail: async (email, code) => {
      emailsSent.push({ email, code });
      return { ok: true };
    },
    hashCode: async (code) => `hashed:${code}`,
    verifyCode: async (code, hash) => hash === `hashed:${code}`,
    hashPassword: async (pw) => `hashed-pw:${pw}`,
    signToken: () => "tok-stub",
    now: () => fixedNow,
    newId: () => `code-${codes.length + 1}`,
    generateCode: () => "4827",
  };

  const service = createPasswordResetService(deps);

  const app = new Hono();
  app.post("/auth/forgot-password", async (c) => {
    try {
      return c.json(await service.requestCode(await c.req.json()));
    } catch (err) {
      return handleError(c, err);
    }
  });
  app.post("/auth/verify-reset-code", async (c) => {
    try {
      return c.json(await service.verifyCode(await c.req.json()));
    } catch (err) {
      return handleError(c, err);
    }
  });
  app.post("/auth/reset-password", async (c) => {
    try {
      return c.json(await service.resetPassword(await c.req.json()));
    } catch (err) {
      return handleError(c, err);
    }
  });

  return { app, codes, usersDb, emailsSent };
}

function jsonRequest(path: string, body: unknown) {
  return new Request(`http://test${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("forgot-password: 200 для существующего email с success в теле", async () => {
  const { app, codes, emailsSent } = makeApp();

  const res = await app.fetch(
    jsonRequest("/auth/forgot-password", { email: "alia@school.kz" }),
  );

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { success: true });
  assert.equal(codes.length, 1);
  assert.equal(emailsSent.length, 1);
});

test("forgot-password: 200 для неизвестного email с тем же телом (no enumeration)", async () => {
  const { app, codes, emailsSent } = makeApp();

  const res = await app.fetch(
    jsonRequest("/auth/forgot-password", { email: "ghost@nowhere.kz" }),
  );

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { success: true });
  assert.equal(codes.length, 0, "ничего не записано");
  assert.equal(emailsSent.length, 0, "ничего не отправлено");
});

test("verify-reset-code: 200 + valid:true для правильного кода", async () => {
  const { app } = makeApp();

  await app.fetch(
    jsonRequest("/auth/forgot-password", { email: "alia@school.kz" }),
  );
  const res = await app.fetch(
    jsonRequest("/auth/verify-reset-code", {
      email: "alia@school.kz",
      code: "4827",
    }),
  );

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { valid: true });
});

test("verify-reset-code: 400 + ValidationError для неверного кода", async () => {
  const { app } = makeApp();

  await app.fetch(
    jsonRequest("/auth/forgot-password", { email: "alia@school.kz" }),
  );
  const res = await app.fetch(
    jsonRequest("/auth/verify-reset-code", {
      email: "alia@school.kz",
      code: "0000",
    }),
  );

  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: { code: string } };
  assert.equal(body.error.code, "VALIDATION_ERROR");
});

test("reset-password: 200 + token + user (формат как login), пароль обновлён", async () => {
  const { app, usersDb } = makeApp();

  await app.fetch(
    jsonRequest("/auth/forgot-password", { email: "alia@school.kz" }),
  );
  const res = await app.fetch(
    jsonRequest("/auth/reset-password", {
      email: "alia@school.kz",
      code: "4827",
      newPassword: "fresh-secret",
    }),
  );

  assert.equal(res.status, 200);
  const body = (await res.json()) as { token: string; user: { id: string } };
  assert.equal(body.token, "tok-stub");
  assert.equal(body.user.id, "user-1");
  assert.equal(usersDb[0].passwordHash, "hashed-pw:fresh-secret");
});

test("reset-password: 400 для неверного кода, пароль не меняется", async () => {
  const { app, usersDb } = makeApp();

  await app.fetch(
    jsonRequest("/auth/forgot-password", { email: "alia@school.kz" }),
  );
  const res = await app.fetch(
    jsonRequest("/auth/reset-password", {
      email: "alia@school.kz",
      code: "9999",
      newPassword: "fresh-secret",
    }),
  );

  assert.equal(res.status, 400);
  assert.equal(usersDb[0].passwordHash, "hashed-pw:old");
});
