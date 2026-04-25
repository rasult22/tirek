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
        createdAt: new Date("2026-04-25T10:00:00.000Z"),
      };
      fakes.users.push(user);
      return user;
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
