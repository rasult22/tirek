import { test } from "node:test";
import assert from "node:assert/strict";

import { createAuthService } from "./auth.service.js";
import type {
  AuthServiceDeps,
  PersistedInviteCodeForAuth,
  PersistedUser,
} from "./auth.service.js";

type Fakes = {
  users: PersistedUser[];
  inviteCodes: PersistedInviteCodeForAuth[];
  studentPsychologistLinks: Array<{ studentId: string; psychologistId: string }>;
};

function makeService(seed?: { inviteCodes?: PersistedInviteCodeForAuth[] }) {
  const fakes: Fakes = {
    users: [],
    inviteCodes: seed?.inviteCodes
      ? seed.inviteCodes.map((c) => ({ ...c }))
      : [],
    studentPsychologistLinks: [],
  };
  let idCounter = 0;
  const deps: AuthServiceDeps = {
    findUserByEmail: async (email) =>
      fakes.users.find((u) => u.email === email) ?? null,
    findUserById: async (id) =>
      fakes.users.find((u) => u.id === id) ?? null,
    createUser: async (data) => {
      const user: PersistedUser = {
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
        createdAt: new Date("2026-04-25T10:00:00.000Z"),
      };
      fakes.users.push(user);
      return user;
    },
    softDeleteUser: async (id, when) => {
      const u = fakes.users.find((x) => x.id === id);
      if (!u) return null;
      u.email = `deleted-${id}@deleted.tirek.kz`;
      u.name = "Deleted user";
      u.passwordHash = "!deleted";
      u.deletedAt = when;
      return u;
    },
    markOnboardedNow: async (id, when) => {
      const u = fakes.users.find((x) => x.id === id);
      if (!u) return null;
      if (u.onboardedAt === null) {
        u.onboardedAt = when;
      }
      return u;
    },
    updateUserProfile: async (id, data) => {
      const u = fakes.users.find((x) => x.id === id);
      if (!u) return null;
      Object.assign(u, data);
      return u;
    },
    findActiveInviteByCode: async (code) =>
      fakes.inviteCodes.find(
        (c) => c.code === code && c.usedBy === null,
      ) ?? null,
    markInviteCodeUsed: async (id, userId) => {
      const c = fakes.inviteCodes.find((x) => x.id === id);
      if (c) {
        c.usedBy = userId;
        c.usedAt = new Date("2026-04-25T10:00:00.000Z");
      }
    },
    linkStudentToPsychologist: async (studentId, psychologistId) => {
      fakes.studentPsychologistLinks.push({ studentId, psychologistId });
    },
    hashPassword: async (pw) => `hashed:${pw}`,
    verifyPassword: async (pw, hash) => hash === `hashed:${pw}`,
    signToken: () => "token-stub",
    now: () => new Date("2026-04-25T10:00:00.000Z"),
    newId: () => `user-${++idCounter}`,
  };
  return { service: createAuthService(deps), fakes };
}

test("register (student): uses studentRealName from invite_codes as users.name (no name from body)", async () => {
  const { service, fakes } = makeService({
    inviteCodes: [
      {
        id: "ic-1",
        code: "ABC123",
        psychologistId: "psy-1",
        studentRealName: "Алия Кенжебекова",
        grade: 9,
        classLetter: "Б",
        usedBy: null,
        usedAt: null,
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      },
    ],
  });

  const result = await service.register({
    email: "alia@school.kz",
    password: "secret123",
    inviteCode: "ABC123",
  });

  assert.equal(result.user.name, "Алия Кенжебекова");
  assert.equal(fakes.users.length, 1);
  assert.equal(fakes.users[0].name, "Алия Кенжебекова");
  assert.equal(fakes.users[0].grade, 9);
  assert.equal(fakes.users[0].classLetter, "Б");
  assert.equal(fakes.inviteCodes[0].usedBy, fakes.users[0].id);
  assert.deepEqual(fakes.studentPsychologistLinks, [
    { studentId: fakes.users[0].id, psychologistId: "psy-1" },
  ]);
});

test("register (student): created student has schoolId null even though invite is psychologist-only territory", async () => {
  const { service, fakes } = makeService({
    inviteCodes: [
      {
        id: "ic-1",
        code: "XYZ789",
        psychologistId: "psy-1",
        studentRealName: "Test Student",
        grade: null,
        classLetter: null,
        usedBy: null,
        usedAt: null,
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      },
    ],
  });

  await service.register({
    email: "s@s.kz",
    password: "p",
    inviteCode: "XYZ789",
  });

  assert.equal(fakes.users[0].schoolId, null);
});

// ── Onboarding flag (issue #112) ────────────────────────────────────
// Источник истины — поле users.onboarded_at на сервере. Public-репрезентация
// юзера несёт derived boolean onboardingCompleted (= onboardedAt != null),
// чтобы клиент не таскал raw timestamp.

test("me: onboardingCompleted=false, если onboardedAt === null", async () => {
  const { service, fakes } = makeService();
  fakes.users.push({
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
  });

  const result = await service.me("u-1");

  assert.equal(result.onboardingCompleted, false);
});

test("register-psychologist: свежий юзер получает onboardingCompleted=false", async () => {
  const { service } = makeService();

  const result = await service.registerPsychologist({
    email: "new-psy@school.kz",
    password: "secret123",
    name: "Новый Психолог",
  });

  assert.equal(result.user.onboardingCompleted, false);
});

test("completeOnboarding: ставит onboardedAt = now() и возвращает user с onboardingCompleted=true", async () => {
  const { service, fakes } = makeService();
  fakes.users.push({
    id: "u-4",
    email: "fresh@school.kz",
    passwordHash: "hashed:pw",
    name: "Свежий",
    role: "psychologist",
    language: "ru",
    avatarId: null,
    grade: null,
    classLetter: null,
    schoolId: null,
    onboardedAt: null,
    deletedAt: null,
    createdAt: new Date("2026-04-25T10:00:00.000Z"),
  });

  const result = await service.completeOnboarding("u-4");

  assert.equal(result.onboardingCompleted, true);
  assert.deepEqual(
    fakes.users[0].onboardedAt,
    new Date("2026-04-25T10:00:00.000Z"),
  );
});

test("completeOnboarding: идемпотентно — повторный вызов не двигает уже выставленный onboardedAt", async () => {
  const original = new Date("2026-04-26T12:00:00.000Z");
  const { service, fakes } = makeService();
  fakes.users.push({
    id: "u-5",
    email: "alreadydone@school.kz",
    passwordHash: "hashed:pw",
    name: "Уже Прошёл",
    role: "psychologist",
    language: "ru",
    avatarId: null,
    grade: null,
    classLetter: null,
    schoolId: null,
    onboardedAt: original,
    deletedAt: null,
    createdAt: new Date("2026-04-25T10:00:00.000Z"),
  });

  const result = await service.completeOnboarding("u-5");

  assert.equal(result.onboardingCompleted, true);
  assert.deepEqual(fakes.users[0].onboardedAt, original);
});

test("completeOnboarding: бросает NotFoundError для несуществующего юзера", async () => {
  const { service } = makeService();

  await assert.rejects(
    () => service.completeOnboarding("nope"),
    /User not found/,
  );
});

test("login: возвращает onboardingCompleted из текущего состояния users.onboardedAt", async () => {
  const { service, fakes } = makeService();
  fakes.users.push({
    id: "u-3",
    email: "logged@school.kz",
    passwordHash: "hashed:secret123",
    name: "Уже Прошёл",
    role: "psychologist",
    language: "ru",
    avatarId: null,
    grade: null,
    classLetter: null,
    schoolId: null,
    onboardedAt: new Date("2026-04-26T12:00:00.000Z"),
    deletedAt: null,
    createdAt: new Date("2026-04-25T10:00:00.000Z"),
  });

  const result = await service.login({
    email: "logged@school.kz",
    password: "secret123",
  });

  assert.equal(result.user.onboardingCompleted, true);
});

test("me: onboardingCompleted=true, если onboardedAt заполнен", async () => {
  const { service, fakes } = makeService();
  fakes.users.push({
    id: "u-2",
    email: "psy2@school.kz",
    passwordHash: "hashed:pw",
    name: "Психолог 2",
    role: "psychologist",
    language: "ru",
    avatarId: null,
    grade: null,
    classLetter: null,
    schoolId: null,
    onboardedAt: new Date("2026-04-26T12:00:00.000Z"),
    deletedAt: null,
    createdAt: new Date("2026-04-25T10:00:00.000Z"),
  });

  const result = await service.me("u-2");

  assert.equal(result.onboardingCompleted, true);
});

// ── Soft delete (issue #113) ────────────────────────────────────────
// App Store 5.1.1(v): пользователь должен иметь возможность удалить аккаунт
// изнутри приложения. Hard delete не подходит (привязанные ученики и история);
// делаем анонимизацию: email / name / passwordHash затираются, deletedAt=now().

test("deleteAccount: анонимизирует email/name/passwordHash и ставит deletedAt = now()", async () => {
  const { service, fakes } = makeService();
  fakes.users.push({
    id: "u-del",
    email: "psy@school.kz",
    passwordHash: "hashed:secret123",
    name: "Психолог Удаляемый",
    role: "psychologist",
    language: "ru",
    avatarId: null,
    grade: null,
    classLetter: null,
    schoolId: null,
    onboardedAt: null,
    deletedAt: null,
    createdAt: new Date("2026-04-25T10:00:00.000Z"),
  });

  await service.deleteAccount("u-del", { confirmEmail: "psy@school.kz" });

  const u = fakes.users[0];
  assert.equal(u.email, "deleted-u-del@deleted.tirek.kz");
  assert.equal(u.name, "Deleted user");
  assert.equal(u.passwordHash, "!deleted");
  assert.deepEqual(u.deletedAt, new Date("2026-04-25T10:00:00.000Z"));
});

test("deleteAccount: confirmEmail не совпадает с текущим email → ValidationError, БД не меняется", async () => {
  const { service, fakes } = makeService();
  fakes.users.push({
    id: "u-del-2",
    email: "real@school.kz",
    passwordHash: "hashed:secret123",
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
  });

  await assert.rejects(
    () => service.deleteAccount("u-del-2", { confirmEmail: "wrong@school.kz" }),
    /confirm email/i,
  );

  const u = fakes.users[0];
  assert.equal(u.email, "real@school.kz");
  assert.equal(u.deletedAt, null);
});

test("deleteAccount: несуществующий userId → NotFoundError", async () => {
  const { service } = makeService();

  await assert.rejects(
    () => service.deleteAccount("ghost", { confirmEmail: "anything@x.kz" }),
    /User not found/,
  );
});

test("login: deleted user → UnauthorizedError даже если пароль валидный (защита через deletedAt, не через verifyPassword)", async () => {
  // Edge-case: даже если каким-то образом hash валиден (старый toggle, future-proof
  // для случая, если репозиторий позже сохранит реальный hash), deletedAt должен
  // блокировать login. Сообщение — то же самое, что для bad password (факт удаления
  // не раскрывается).
  const { service, fakes } = makeService();
  fakes.users.push({
    id: "u-gone",
    email: "still-real@school.kz",
    passwordHash: "hashed:secret123",
    name: "Психолог",
    role: "psychologist",
    language: "ru",
    avatarId: null,
    grade: null,
    classLetter: null,
    schoolId: null,
    onboardedAt: new Date("2026-04-20T10:00:00.000Z"),
    deletedAt: new Date("2026-04-25T10:00:00.000Z"),
    createdAt: new Date("2026-04-15T10:00:00.000Z"),
  });

  await assert.rejects(
    () =>
      service.login({
        email: "still-real@school.kz",
        password: "secret123",
      }),
    /Invalid email or password/,
  );
});

test("me: deleted user → NotFoundError (старый токен ведёт на logout у клиента)", async () => {
  const { service, fakes } = makeService();
  fakes.users.push({
    id: "u-zombie",
    email: "deleted-u-zombie@deleted.tirek.kz",
    passwordHash: "!deleted",
    name: "Deleted user",
    role: "psychologist",
    language: "ru",
    avatarId: null,
    grade: null,
    classLetter: null,
    schoolId: null,
    onboardedAt: new Date("2026-04-20T10:00:00.000Z"),
    deletedAt: new Date("2026-04-25T10:00:00.000Z"),
    createdAt: new Date("2026-04-15T10:00:00.000Z"),
  });

  await assert.rejects(() => service.me("u-zombie"), /User not found/);
});
