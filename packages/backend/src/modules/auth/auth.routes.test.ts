import { test } from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";

import { createAuthService } from "./auth.service.js";
import type {
  AuthServiceDeps,
  PersistedUser,
} from "./auth.service.js";
import { handleError } from "../../shared/errors.js";

// Smoke-тест http-контракта /auth/onboarding/complete через in-process Hono.
// Auth-middleware на этом уровне не подключаем: тест проверяет, что роут
// корректно вызывает service и сериализует ответ. Полный auth-флоу — в server.ts.

function makeApp() {
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");
  const usersDb: PersistedUser[] = [
    {
      id: "u-1",
      email: "psy@school.kz",
      passwordHash: "hashed:pw",
      name: "Психолог",
      role: "psychologist",
      language: "ru",
      avatarId: null,
      grade: null,
      classLetter: null,
      schoolId: null,
      onboardedAt: null,
      deletedAt: null,
      createdAt: new Date("2026-04-25T10:00:00.000Z"),
    },
  ];

  const deps: AuthServiceDeps = {
    findUserByEmail: async (email) =>
      usersDb.find((u) => u.email === email) ?? null,
    findUserById: async (id) => usersDb.find((u) => u.id === id) ?? null,
    createUser: async () => {
      throw new Error("not used in this test");
    },
    updateUserProfile: async () => {
      throw new Error("not used in this test");
    },
    markOnboardedNow: async (id, when) => {
      const u = usersDb.find((x) => x.id === id);
      if (!u) return null;
      if (u.onboardedAt === null) u.onboardedAt = when;
      return u;
    },
    softDeleteUser: async () => {
      throw new Error("not used in this test");
    },
    findActiveInviteByCode: async () => null,
    markInviteCodeUsed: async () => {},
    linkStudentToPsychologist: async () => {},
    hashPassword: async (pw) => `hashed:${pw}`,
    verifyPassword: async (pw, hash) => hash === `hashed:${pw}`,
    signToken: () => "tok-stub",
    now: () => fixedNow,
    newId: () => "id-stub",
  };

  const service = createAuthService(deps);

  const app = new Hono();
  app.post("/auth/onboarding/complete", async (c) => {
    try {
      // userId берём из заголовка-стаба, реальный middleware подменяется на роут-уровне в server.ts.
      const userId = c.req.header("x-user-id") ?? "";
      return c.json(await service.completeOnboarding(userId));
    } catch (err) {
      return handleError(c, err);
    }
  });

  return { app, usersDb, fixedNow };
}

test("POST /auth/onboarding/complete: 200 + user с onboardingCompleted=true; onboardedAt = now()", async () => {
  const { app, usersDb, fixedNow } = makeApp();

  const res = await app.fetch(
    new Request("http://test/auth/onboarding/complete", {
      method: "POST",
      headers: { "x-user-id": "u-1" },
    }),
  );

  assert.equal(res.status, 200);
  const body = (await res.json()) as { id: string; onboardingCompleted: boolean };
  assert.equal(body.id, "u-1");
  assert.equal(body.onboardingCompleted, true);
  assert.deepEqual(usersDb[0].onboardedAt, fixedNow);
});

test("POST /auth/onboarding/complete: 404 для несуществующего юзера", async () => {
  const { app } = makeApp();

  const res = await app.fetch(
    new Request("http://test/auth/onboarding/complete", {
      method: "POST",
      headers: { "x-user-id": "ghost" },
    }),
  );

  assert.equal(res.status, 404);
});

// ── Soft delete (issue #113) ────────────────────────────────────────
// Полноценный флоу через in-process Hono: register → delete → login → 401.
// Auth-middleware заменён заголовком x-user-id, чтобы не тащить JWT-логику.

function makeFlowApp() {
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");
  const usersDb: PersistedUser[] = [];
  let idCounter = 0;

  const deps: AuthServiceDeps = {
    findUserByEmail: async (email) =>
      usersDb.find((u) => u.email === email) ?? null,
    findUserById: async (id) => usersDb.find((u) => u.id === id) ?? null,
    createUser: async (data) => {
      const u: PersistedUser = {
        id: data.id,
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role,
        language: "ru",
        avatarId: null,
        grade: data.grade ?? null,
        classLetter: data.classLetter ?? null,
        schoolId: data.schoolId ?? null,
        onboardedAt: null,
        deletedAt: null,
        createdAt: fixedNow,
      };
      usersDb.push(u);
      return u;
    },
    updateUserProfile: async () => null,
    markOnboardedNow: async () => null,
    softDeleteUser: async (id, when) => {
      const u = usersDb.find((x) => x.id === id);
      if (!u) return null;
      u.email = `deleted-${id}@deleted.tirek.kz`;
      u.name = "Deleted user";
      u.passwordHash = "!deleted";
      u.deletedAt = when;
      return u;
    },
    findActiveInviteByCode: async () => null,
    markInviteCodeUsed: async () => {},
    linkStudentToPsychologist: async () => {},
    hashPassword: async (pw) => `hashed:${pw}`,
    verifyPassword: async (pw, hash) => hash === `hashed:${pw}`,
    signToken: () => "tok-stub",
    now: () => fixedNow,
    newId: () => `u-${++idCounter}`,
  };

  const service = createAuthService(deps);
  const app = new Hono();

  app.post("/auth/register-psychologist", async (c) => {
    try {
      const body = await c.req.json();
      return c.json(await service.registerPsychologist(body), 201);
    } catch (err) {
      return handleError(c, err);
    }
  });
  app.post("/auth/login", async (c) => {
    try {
      const body = await c.req.json();
      return c.json(await service.login(body));
    } catch (err) {
      return handleError(c, err);
    }
  });
  app.post("/auth/me/delete", async (c) => {
    try {
      const userId = c.req.header("x-user-id") ?? "";
      const body = await c.req.json();
      await service.deleteAccount(userId, body);
      return c.body(null, 204);
    } catch (err) {
      return handleError(c, err);
    }
  });

  return { app, usersDb };
}

test("integration: register-psychologist → delete → login снова → 401", async () => {
  const { app, usersDb } = makeFlowApp();

  const reg = await app.fetch(
    new Request("http://test/auth/register-psychologist", {
      method: "POST",
      body: JSON.stringify({
        email: "psy@school.kz",
        password: "secret123",
        name: "Психолог",
      }),
      headers: { "content-type": "application/json" },
    }),
  );
  assert.equal(reg.status, 201);
  const regBody = (await reg.json()) as { user: { id: string } };
  const userId = regBody.user.id;

  const del = await app.fetch(
    new Request("http://test/auth/me/delete", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ confirmEmail: "psy@school.kz" }),
    }),
  );
  assert.equal(del.status, 204);

  // После delete email анонимизирован, оригинальный — свободен для повторной регистрации.
  assert.equal(usersDb[0].email, `deleted-${userId}@deleted.tirek.kz`);
  assert.equal(usersDb[0].name, "Deleted user");
  assert.equal(usersDb[0].passwordHash, "!deleted");
  assert.notEqual(usersDb[0].deletedAt, null);

  // Login на оригинальный email → 401 (юзер уже не находится по нему).
  const login1 = await app.fetch(
    new Request("http://test/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "psy@school.kz", password: "secret123" }),
      headers: { "content-type": "application/json" },
    }),
  );
  assert.equal(login1.status, 401);

  // Login на анонимизированный email с любым паролем → тоже 401 (deletedAt-guard).
  const login2 = await app.fetch(
    new Request("http://test/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: `deleted-${userId}@deleted.tirek.kz`,
        password: "secret123",
      }),
      headers: { "content-type": "application/json" },
    }),
  );
  assert.equal(login2.status, 401);
});

test("integration: deleteAccount с неверным confirmEmail → 400, БД не меняется", async () => {
  const { app, usersDb } = makeFlowApp();

  await app.fetch(
    new Request("http://test/auth/register-psychologist", {
      method: "POST",
      body: JSON.stringify({
        email: "psy@school.kz",
        password: "secret123",
        name: "Психолог",
      }),
      headers: { "content-type": "application/json" },
    }),
  );
  const userId = usersDb[0].id;

  const del = await app.fetch(
    new Request("http://test/auth/me/delete", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ confirmEmail: "wrong@school.kz" }),
    }),
  );

  assert.equal(del.status, 400);
  assert.equal(usersDb[0].email, "psy@school.kz");
  assert.equal(usersDb[0].deletedAt, null);
});
