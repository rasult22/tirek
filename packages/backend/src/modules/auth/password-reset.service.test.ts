import { test } from "node:test";
import assert from "node:assert/strict";

import { createPasswordResetService } from "./password-reset.service.js";
import type {
  PasswordResetServiceDeps,
  PersistedResetCode,
} from "./password-reset.service.js";
import type { PersistedUser } from "./auth.service.js";

type Fakes = {
  users: PersistedUser[];
  codes: PersistedResetCode[];
  emailsSent: Array<{ email: string; code: string; lang: string }>;
};

type Overrides = {
  now?: Date;
  generateCode?: () => string;
};

function makeService(seed?: { users?: PersistedUser[] }, overrides?: Overrides) {
  const fakes: Fakes = {
    users: seed?.users ? seed.users.map((u) => ({ ...u })) : [],
    codes: [],
    emailsSent: [],
  };
  let idCounter = 0;
  const fixedNow = overrides?.now ?? new Date("2026-05-04T10:00:00.000Z");
  const deps: PasswordResetServiceDeps = {
    findUserByEmail: async (email) =>
      fakes.users.find((u) => u.email === email) ?? null,
    invalidateActiveCodesForUser: async (userId, when) => {
      for (const c of fakes.codes) {
        if (c.userId === userId && c.usedAt === null) {
          c.usedAt = when;
        }
      }
    },
    countRecentCodesForUser: async (userId, since) =>
      fakes.codes.filter(
        (c) => c.userId === userId && c.createdAt >= since,
      ).length,
    findLatestCodeForUser: async (userId) => {
      const sorted = fakes.codes
        .filter((c) => c.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return sorted[0] ?? null;
    },
    findActiveCodeForUser: async (userId, when) => {
      return (
        fakes.codes.find(
          (c) =>
            c.userId === userId &&
            c.usedAt === null &&
            c.expiresAt > when,
        ) ?? null
      );
    },
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
      fakes.codes.push(row);
      return row;
    },
    incrementAttempts: async (codeId) => {
      const c = fakes.codes.find((x) => x.id === codeId);
      if (c) c.attempts += 1;
      return c ?? null;
    },
    markCodeUsed: async (codeId, when) => {
      const c = fakes.codes.find((x) => x.id === codeId);
      if (c) c.usedAt = when;
    },
    updateUserPassword: async (userId, passwordHash) => {
      const u = fakes.users.find((x) => x.id === userId);
      if (u) u.passwordHash = passwordHash;
    },
    sendResetCodeEmail: async (email, code, lang) => {
      fakes.emailsSent.push({ email, code, lang });
      return { ok: true };
    },
    hashCode: async (code) => `hashed:${code}`,
    verifyCode: async (code, hash) => hash === `hashed:${code}`,
    hashPassword: async (pw) => `hashed-pw:${pw}`,
    signToken: () => "token-stub",
    now: () => fixedNow,
    newId: () => `code-${++idCounter}`,
    generateCode: overrides?.generateCode ?? (() => "1234"),
  };
  return { service: createPasswordResetService(deps), fakes };
}

function fakeUser(over: Partial<PersistedUser> = {}): PersistedUser {
  return {
    id: "user-1",
    email: "alia@school.kz",
    passwordHash: "hashed-pw:old-secret",
    name: "Алия",
    role: "student",
    language: "ru",
    avatarId: null,
    grade: 9,
    classLetter: "Б",
    schoolId: null,
    onboardedAt: null,
    deletedAt: null,
    createdAt: new Date("2026-04-01T00:00:00.000Z"),
    ...over,
  };
}

test("requestCode: неизвестный email — возвращает success без записи и без email", async () => {
  const { service, fakes } = makeService();

  const result = await service.requestCode({ email: "ghost@nowhere.kz" });

  assert.deepEqual(result, { success: true });
  assert.equal(fakes.codes.length, 0);
  assert.equal(fakes.emailsSent.length, 0);
});

// ── verifyCode ───────────────────────────────────────────────────────

// ── resetPassword ────────────────────────────────────────────────────

test("resetPassword: правильный код — { token, user }, пароль обновлён, код помечен used", async () => {
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");
  const { service, fakes } = makeService(
    { users: [fakeUser()] },
    { now: fixedNow },
  );
  fakes.codes.push({
    id: "code-1",
    userId: "user-1",
    codeHash: "hashed:4827",
    expiresAt: new Date(fixedNow.getTime() + 10 * 60 * 1000),
    usedAt: null,
    attempts: 1,
    createdAt: new Date(fixedNow.getTime() - 5 * 60 * 1000),
  });

  const result = await service.resetPassword({
    email: "alia@school.kz",
    code: "4827",
    newPassword: "new-secret-123",
  });

  assert.equal(result.token, "token-stub");
  assert.equal(result.user.id, "user-1");
  assert.equal(result.user.email, "alia@school.kz");
  assert.equal(result.user.role, "student");
  // публичный user без passwordHash
  assert.ok(!("passwordHash" in result.user));
  // пароль обновлён в users
  assert.equal(fakes.users[0].passwordHash, "hashed-pw:new-secret-123");
  // код помечен used
  assert.deepEqual(fakes.codes[0].usedAt, fixedNow);
});

test("resetPassword: неверный код — ValidationError, пароль не меняется", async () => {
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");
  const { service, fakes } = makeService(
    { users: [fakeUser()] },
    { now: fixedNow },
  );
  fakes.codes.push({
    id: "code-1",
    userId: "user-1",
    codeHash: "hashed:4827",
    expiresAt: new Date(fixedNow.getTime() + 10 * 60 * 1000),
    usedAt: null,
    attempts: 0,
    createdAt: new Date(fixedNow.getTime() - 5 * 60 * 1000),
  });

  const err = await service
    .resetPassword({
      email: "alia@school.kz",
      code: "9999",
      newPassword: "new-secret-123",
    })
    .then(
      () => null,
      (e: unknown) => e,
    );

  assert.ok(err);
  assert.equal((err as { statusCode?: number }).statusCode, 400);
  assert.equal(fakes.users[0].passwordHash, "hashed-pw:old-secret", "пароль не изменён");
  assert.equal(fakes.codes[0].usedAt, null, "код не помечен used");
});

test("resetPassword: истёкший код — ValidationError", async () => {
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");
  const { service, fakes } = makeService(
    { users: [fakeUser()] },
    { now: fixedNow },
  );
  fakes.codes.push({
    id: "code-expired",
    userId: "user-1",
    codeHash: "hashed:4827",
    expiresAt: new Date(fixedNow.getTime() - 60 * 1000),
    usedAt: null,
    attempts: 0,
    createdAt: new Date(fixedNow.getTime() - 16 * 60 * 1000),
  });

  const err = await service
    .resetPassword({
      email: "alia@school.kz",
      code: "4827",
      newPassword: "new-secret-123",
    })
    .then(
      () => null,
      (e: unknown) => e,
    );

  assert.ok(err);
  assert.equal((err as { statusCode?: number }).statusCode, 400);
  assert.equal(fakes.users[0].passwordHash, "hashed-pw:old-secret");
});

test("resetPassword: уже использованный код — ValidationError", async () => {
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");
  const { service, fakes } = makeService(
    { users: [fakeUser()] },
    { now: fixedNow },
  );
  fakes.codes.push({
    id: "code-used",
    userId: "user-1",
    codeHash: "hashed:4827",
    expiresAt: new Date(fixedNow.getTime() + 10 * 60 * 1000),
    usedAt: new Date(fixedNow.getTime() - 60 * 1000),
    attempts: 1,
    createdAt: new Date(fixedNow.getTime() - 5 * 60 * 1000),
  });

  const err = await service
    .resetPassword({
      email: "alia@school.kz",
      code: "4827",
      newPassword: "new-secret-123",
    })
    .then(
      () => null,
      (e: unknown) => e,
    );

  assert.ok(err);
  assert.equal((err as { statusCode?: number }).statusCode, 400);
});

test("verifyCode: неверный код — ValidationError, attempts инкрементирован", async () => {
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");
  const { service, fakes } = makeService(
    { users: [fakeUser()] },
    { now: fixedNow },
  );
  fakes.codes.push({
    id: "code-1",
    userId: "user-1",
    codeHash: "hashed:4827",
    expiresAt: new Date(fixedNow.getTime() + 10 * 60 * 1000),
    usedAt: null,
    attempts: 0,
    createdAt: new Date(fixedNow.getTime() - 5 * 60 * 1000),
  });

  const err = await service
    .verifyCode({ email: "alia@school.kz", code: "9999" })
    .then(
      () => null,
      (e: unknown) => e,
    );

  assert.ok(err);
  assert.equal((err as { statusCode?: number }).statusCode, 400);
  assert.equal(fakes.codes[0].attempts, 1);
  assert.equal(fakes.codes[0].usedAt, null);
});

test("verifyCode: истёкший код — ValidationError, attempts не инкрементирован", async () => {
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");
  const { service, fakes } = makeService(
    { users: [fakeUser()] },
    { now: fixedNow },
  );
  fakes.codes.push({
    id: "code-expired",
    userId: "user-1",
    codeHash: "hashed:4827",
    expiresAt: new Date(fixedNow.getTime() - 60 * 1000), // истёк
    usedAt: null,
    attempts: 0,
    createdAt: new Date(fixedNow.getTime() - 16 * 60 * 1000),
  });

  const err = await service
    .verifyCode({ email: "alia@school.kz", code: "4827" })
    .then(
      () => null,
      (e: unknown) => e,
    );

  assert.ok(err);
  assert.equal((err as { statusCode?: number }).statusCode, 400);
  assert.equal(fakes.codes[0].attempts, 0, "истёкший код не считается попыткой");
});

test("verifyCode: 5-я неверная попытка → код помечен used_at, дальше не работает", async () => {
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");
  const { service, fakes } = makeService(
    { users: [fakeUser()] },
    { now: fixedNow },
  );
  fakes.codes.push({
    id: "code-1",
    userId: "user-1",
    codeHash: "hashed:4827",
    expiresAt: new Date(fixedNow.getTime() + 10 * 60 * 1000),
    usedAt: null,
    attempts: 4, // следующая попытка будет 5-й
    createdAt: new Date(fixedNow.getTime() - 5 * 60 * 1000),
  });

  // 5-я попытка с неверным кодом
  await service
    .verifyCode({ email: "alia@school.kz", code: "9999" })
    .catch(() => null);

  assert.equal(fakes.codes[0].attempts, 5);
  assert.deepEqual(fakes.codes[0].usedAt, fixedNow, "код помечен used_at");

  // Даже правильный код после превышения не работает (уже used)
  const err = await service
    .verifyCode({ email: "alia@school.kz", code: "4827" })
    .then(
      () => null,
      (e: unknown) => e,
    );
  assert.ok(err);
  assert.equal((err as { statusCode?: number }).statusCode, 400);
});

test("verifyCode: правильный код — { valid: true }, attempts увеличен на 1", async () => {
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");
  const { service, fakes } = makeService(
    { users: [fakeUser()] },
    { now: fixedNow },
  );
  fakes.codes.push({
    id: "code-1",
    userId: "user-1",
    codeHash: "hashed:4827",
    expiresAt: new Date(fixedNow.getTime() + 10 * 60 * 1000),
    usedAt: null,
    attempts: 0,
    createdAt: new Date(fixedNow.getTime() - 5 * 60 * 1000),
  });

  const result = await service.verifyCode({
    email: "alia@school.kz",
    code: "4827",
  });

  assert.deepEqual(result, { valid: true });
  assert.equal(fakes.codes[0].attempts, 1);
  assert.equal(fakes.codes[0].usedAt, null, "успешная проверка не помечает код used");
});

test("requestCode: rate-limit — 4-й запрос за 15 минут → 429", async () => {
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");
  const { service, fakes } = makeService(
    { users: [fakeUser()] },
    { now: fixedNow, generateCode: () => "1111" },
  );
  // 3 запроса за последние 15 минут (но все вне debounce-окна 60сек)
  for (let i = 0; i < 3; i++) {
    fakes.codes.push({
      id: `code-${i}`,
      userId: "user-1",
      codeHash: `hashed:${i}`,
      expiresAt: new Date(fixedNow.getTime() + 14 * 60 * 1000),
      usedAt: new Date(fixedNow.getTime() - (10 - i) * 60 * 1000),
      attempts: 0,
      createdAt: new Date(fixedNow.getTime() - (10 - i) * 60 * 1000),
    });
  }

  const err = await service
    .requestCode({ email: "alia@school.kz" })
    .then(
      () => null,
      (e: unknown) => e,
    );

  assert.ok(err);
  assert.equal((err as { statusCode?: number }).statusCode, 429);
  assert.equal(fakes.codes.length, 3, "новый код не создан");
  assert.equal(fakes.emailsSent.length, 0);
});

test("requestCode: rate-limit — старые запросы (>15 минут назад) не учитываются", async () => {
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");
  const { service, fakes } = makeService(
    { users: [fakeUser()] },
    { now: fixedNow, generateCode: () => "1111" },
  );
  // 3 запроса, но все старше 15 минут
  for (let i = 0; i < 3; i++) {
    fakes.codes.push({
      id: `code-${i}`,
      userId: "user-1",
      codeHash: `hashed:${i}`,
      expiresAt: new Date(fixedNow.getTime() - (16 - i) * 60 * 1000 + 15 * 60 * 1000),
      usedAt: new Date(fixedNow.getTime() - (16 - i) * 60 * 1000),
      attempts: 0,
      createdAt: new Date(fixedNow.getTime() - (16 + i) * 60 * 1000),
    });
  }

  const result = await service.requestCode({ email: "alia@school.kz" });

  assert.deepEqual(result, { success: true });
  assert.equal(fakes.emailsSent.length, 1);
});

test("requestCode: debounce 60сек — второй запрос в течение 60сек → 429 TooManyRequests", async () => {
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");
  const { service, fakes } = makeService(
    { users: [fakeUser()] },
    { now: fixedNow, generateCode: () => "1111" },
  );
  // 30 секунд назад уже был запрос
  fakes.codes.push({
    id: "code-recent",
    userId: "user-1",
    codeHash: "hashed:9999",
    expiresAt: new Date(fixedNow.getTime() + 14 * 60 * 1000),
    usedAt: null,
    attempts: 0,
    createdAt: new Date(fixedNow.getTime() - 30 * 1000),
  });

  const err = await service
    .requestCode({ email: "alia@school.kz" })
    .then(
      () => null,
      (e: unknown) => e,
    );

  assert.ok(err, "ожидалась ошибка");
  assert.equal((err as { statusCode?: number }).statusCode, 429);
  // никакого нового кода и письма
  assert.equal(fakes.codes.length, 1);
  assert.equal(fakes.emailsSent.length, 0);
});

test("requestCode: debounce — после 60сек запрос проходит", async () => {
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");
  const { service, fakes } = makeService(
    { users: [fakeUser()] },
    { now: fixedNow, generateCode: () => "1111" },
  );
  // ровно 61 секунд назад
  fakes.codes.push({
    id: "code-old",
    userId: "user-1",
    codeHash: "hashed:9999",
    expiresAt: new Date(fixedNow.getTime() + 14 * 60 * 1000),
    usedAt: null,
    attempts: 0,
    createdAt: new Date(fixedNow.getTime() - 61 * 1000),
  });

  const result = await service.requestCode({ email: "alia@school.kz" });

  assert.deepEqual(result, { success: true });
  assert.equal(fakes.emailsSent.length, 1);
});

test("requestCode: инвалидирует прошлые активные коды юзера (used_at = now)", async () => {
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");
  const { service, fakes } = makeService(
    { users: [fakeUser()] },
    { now: fixedNow, generateCode: () => "5555" },
  );
  // первый запрос — старый код
  await service.requestCode({ email: "alia@school.kz" });
  assert.equal(fakes.codes.length, 1);
  assert.equal(fakes.codes[0].usedAt, null);
  const oldCode = fakes.codes[0];

  // имитируем, что прошло чуть больше debounce — второй запрос
  const laterNow = new Date(fixedNow.getTime() + 90 * 1000);
  // подменим now
  let callCount = 0;
  const { service: s2, fakes: f2 } = makeService(
    { users: [fakeUser()] },
    {
      now: laterNow,
      generateCode: () => (++callCount === 1 ? "1111" : "2222"),
    },
  );
  // зальём «старый» активный код в state
  f2.codes.push({
    id: "code-old",
    userId: "user-1",
    codeHash: "hashed:1111",
    expiresAt: new Date(laterNow.getTime() + 5 * 60 * 1000),
    usedAt: null,
    attempts: 0,
    createdAt: new Date(laterNow.getTime() - 5 * 60 * 1000),
  });

  await s2.requestCode({ email: "alia@school.kz" });

  const old = f2.codes.find((c) => c.id === "code-old");
  assert.ok(old, "старый код должен остаться в строках");
  assert.deepEqual(old!.usedAt, laterNow, "старый код должен быть помечен used_at");
  // и появился новый активный
  const fresh = f2.codes.find((c) => c.id !== "code-old");
  assert.ok(fresh);
  assert.equal(fresh!.usedAt, null);
  // sanity: oldCode из первого фикстуры не пострадал (изоляция)
  assert.equal(oldCode.usedAt, null);
});

test("requestCode: известный email — создаёт код (хэш, TTL=15мин), шлёт email с lang юзера", async () => {
  const fixedNow = new Date("2026-05-04T10:00:00.000Z");
  const { service, fakes } = makeService(
    { users: [fakeUser({ language: "kz" })] },
    { now: fixedNow, generateCode: () => "4827" },
  );

  const result = await service.requestCode({ email: "alia@school.kz" });

  assert.deepEqual(result, { success: true });
  assert.equal(fakes.codes.length, 1);
  assert.equal(fakes.codes[0].userId, "user-1");
  assert.equal(fakes.codes[0].codeHash, "hashed:4827");
  assert.notEqual(fakes.codes[0].codeHash, "4827", "plain код не должен храниться");
  assert.equal(fakes.codes[0].usedAt, null);
  assert.equal(fakes.codes[0].attempts, 0);
  // TTL = 15 минут от now()
  assert.equal(
    fakes.codes[0].expiresAt.getTime() - fixedNow.getTime(),
    15 * 60 * 1000,
  );
  assert.deepEqual(fakes.emailsSent, [
    { email: "alia@school.kz", code: "4827", lang: "kz" },
  ]);
});
