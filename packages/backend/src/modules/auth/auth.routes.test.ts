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
