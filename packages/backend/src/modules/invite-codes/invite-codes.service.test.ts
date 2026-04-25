import { test } from "node:test";
import assert from "node:assert/strict";

import { createInviteCodesService } from "./invite-codes.service.js";
import type {
  InviteCodesServiceDeps,
  PersistedInviteCode,
} from "./invite-codes.service.js";

type Fakes = {
  codes: PersistedInviteCode[];
};

function makeService(overrides: Partial<InviteCodesServiceDeps> = {}) {
  const fakes: Fakes = { codes: [] };
  let idCounter = 0;
  let codeCounter = 0;
  const deps: InviteCodesServiceDeps = {
    createInviteCode: async (data) => {
      const row: PersistedInviteCode = {
        id: data.id,
        code: data.code,
        psychologistId: data.psychologistId,
        studentRealName: data.studentRealName,
        grade: data.grade ?? null,
        classLetter: data.classLetter ?? null,
        usedBy: null,
        usedAt: null,
        expiresAt: data.expiresAt,
        createdAt: new Date("2026-04-25T10:00:00.000Z"),
      };
      fakes.codes.push(row);
      return row;
    },
    findByPsychologist: async () => [],
    countByPsychologist: async () => 0,
    findById: async () => null,
    deleteById: async () => null,
    now: () => new Date("2026-04-25T10:00:00.000Z"),
    newId: () => `id-${++idCounter}`,
    newCode: () => `CODE${++codeCounter}`,
    ...overrides,
  };
  return { service: createInviteCodesService(deps), fakes };
}

test("generate: creates one invite code per name with studentRealName preserved", async () => {
  const { service, fakes } = makeService();

  const result = await service.generate("psy-1", {
    studentNames: ["Иван Иванов", "Мария Сидорова"],
  });

  assert.equal(result.length, 2);
  assert.equal(result[0].studentRealName, "Иван Иванов");
  assert.equal(result[1].studentRealName, "Мария Сидорова");
  assert.equal(fakes.codes.length, 2);
  assert.equal(fakes.codes[0].studentRealName, "Иван Иванов");
  assert.equal(fakes.codes[1].studentRealName, "Мария Сидорова");
});

test("generate: rejects empty studentNames array", async () => {
  const { service, fakes } = makeService();

  await assert.rejects(
    () => service.generate("psy-1", { studentNames: [] }),
    /at least 1/i,
  );
  assert.equal(fakes.codes.length, 0);
});

test("generate: rejects more than 100 names", async () => {
  const { service, fakes } = makeService();
  const names = Array.from({ length: 101 }, (_, i) => `Name ${i}`);

  await assert.rejects(
    () => service.generate("psy-1", { studentNames: names }),
    /100/,
  );
  assert.equal(fakes.codes.length, 0);
});
