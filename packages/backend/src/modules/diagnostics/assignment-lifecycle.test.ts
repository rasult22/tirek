import { test } from "node:test";
import assert from "node:assert/strict";

import { createAssignmentLifecycle } from "./assignment-lifecycle.js";
import type {
  AssignmentLifecycleDeps,
  AssignmentRow,
} from "./assignment-lifecycle.js";

interface FakeStore {
  inserts: AssignmentRow[];
  updates: Array<{ id: string; patch: Partial<AssignmentRow> }>;
}

interface MakeOpts {
  existing?: AssignmentRow[];
}

function baseRow(over: Partial<AssignmentRow> = {}): AssignmentRow {
  return {
    id: "asg-1",
    testId: "test-1",
    assignedBy: "psy-1",
    targetType: "student",
    targetGrade: null,
    targetClassLetter: null,
    targetStudentId: "stu-1",
    dueDate: null,
    status: "pending",
    studentMessage: null,
    cancelledAt: null,
    createdAt: new Date("2026-04-26T10:00:00.000Z"),
    ...over,
  };
}

function makeModule(opts: MakeOpts = {}) {
  const store: FakeStore = { inserts: [], updates: [] };
  const rows = new Map<string, AssignmentRow>();
  for (const r of opts.existing ?? []) rows.set(r.id, r);

  const deps: AssignmentLifecycleDeps = {
    insertAssignment: async (row) => {
      const inserted = { ...row };
      store.inserts.push(inserted);
      rows.set(inserted.id, inserted);
      return inserted;
    },
    findAssignmentById: async (id) => rows.get(id) ?? null,
    updateAssignment: async (id, patch) => {
      const current = rows.get(id);
      if (!current) return null;
      const next = { ...current, ...patch };
      rows.set(id, next);
      store.updates.push({ id, patch });
      return next;
    },
    findAssignmentsByPsychologist: async (psychologistId, filters) => {
      return Array.from(rows.values()).filter((r) => {
        if (r.assignedBy !== psychologistId) return false;
        if (filters?.status && r.status !== filters.status) return false;
        if (filters?.studentId && r.targetStudentId !== filters.studentId)
          return false;
        return true;
      });
    },
  };

  return { module: createAssignmentLifecycle(deps), store, rows };
}

test("assign: studentMessage сохраняется и возвращается в ответе", async () => {
  const { module, store } = makeModule();

  const result = await module.assignTest("psy-1", {
    id: "asg-1",
    testId: "test-1",
    targetType: "student",
    targetStudentId: "stu-1",
    studentMessage: "Пожалуйста, пройди до пятницы — это важно.",
  });

  assert.equal(result.studentMessage, "Пожалуйста, пройди до пятницы — это важно.");
  assert.equal(store.inserts.length, 1);
  assert.equal(
    store.inserts[0].studentMessage,
    "Пожалуйста, пройди до пятницы — это важно.",
  );
});

test("assign: studentMessage > 500 символов → ValidationError, ничего не сохранено", async () => {
  const { module, store } = makeModule();

  await assert.rejects(
    () =>
      module.assignTest("psy-1", {
        id: "asg-1",
        testId: "test-1",
        targetType: "student",
        targetStudentId: "stu-1",
        studentMessage: "а".repeat(501),
      }),
    (err: Error) => err.name === "ValidationError",
  );
  assert.equal(store.inserts.length, 0);
});

test("assign: studentMessage = пустая строка нормализуется в null", async () => {
  const { module, store } = makeModule();

  const result = await module.assignTest("psy-1", {
    id: "asg-1",
    testId: "test-1",
    targetType: "student",
    targetStudentId: "stu-1",
    studentMessage: "   ",
  });

  assert.equal(result.studentMessage, null);
  assert.equal(store.inserts[0].studentMessage, null);
});

test("isActiveAssignment: pending → true, cancelled → false", async () => {
  const { isActiveAssignment } = await import("./assignment-lifecycle.js");
  assert.equal(isActiveAssignment(baseRow({ status: "pending" })), true);
  assert.equal(isActiveAssignment(baseRow({ status: "cancelled" })), false);
});

test("listAssignments: возвращает все назначения психолога", async () => {
  const a1 = baseRow({ id: "asg-1", assignedBy: "psy-1", status: "pending" });
  const a2 = baseRow({
    id: "asg-2",
    assignedBy: "psy-1",
    status: "cancelled",
    targetStudentId: "stu-2",
  });
  const a3 = baseRow({ id: "asg-3", assignedBy: "psy-OTHER", status: "pending" });
  const { module } = makeModule({ existing: [a1, a2, a3] });

  const result = await module.listAssignments("psy-1", {});

  assert.equal(result.length, 2);
  assert.deepEqual(result.map((r) => r.id).sort(), ["asg-1", "asg-2"]);
});

test("listAssignments: фильтр status=cancelled оставляет только cancelled", async () => {
  const a1 = baseRow({ id: "asg-1", assignedBy: "psy-1", status: "pending" });
  const a2 = baseRow({ id: "asg-2", assignedBy: "psy-1", status: "cancelled" });
  const { module } = makeModule({ existing: [a1, a2] });

  const result = await module.listAssignments("psy-1", { status: "cancelled" });

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "asg-2");
});

test("listAssignments: фильтр studentId сужает выборку", async () => {
  const a1 = baseRow({
    id: "asg-1",
    assignedBy: "psy-1",
    targetStudentId: "stu-1",
  });
  const a2 = baseRow({
    id: "asg-2",
    assignedBy: "psy-1",
    targetStudentId: "stu-2",
  });
  const { module } = makeModule({ existing: [a1, a2] });

  const result = await module.listAssignments("psy-1", { studentId: "stu-1" });

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "asg-1");
});

test("cancel: чужой assignment (assignedBy ≠ psychologistId) → ForbiddenError", async () => {
  const existing = baseRow({ id: "asg-1", assignedBy: "psy-OTHER" });
  const { module, store } = makeModule({ existing: [existing] });

  await assert.rejects(
    () => module.cancelAssignment("psy-1", "asg-1"),
    (err: Error) => err.name === "ForbiddenError",
  );
  assert.equal(store.updates.length, 0);
});

test("cancel: уже cancelled → ConflictError, повторная запись не делается", async () => {
  const existing = baseRow({
    id: "asg-1",
    status: "cancelled",
    cancelledAt: new Date("2026-04-25T10:00:00.000Z"),
  });
  const { module, store } = makeModule({ existing: [existing] });

  await assert.rejects(
    () => module.cancelAssignment("psy-1", "asg-1"),
    (err: Error) => err.name === "ConflictError",
  );
  assert.equal(store.updates.length, 0);
});

test("cancel: несуществующий assignment → NotFoundError", async () => {
  const { module } = makeModule();

  await assert.rejects(
    () => module.cancelAssignment("psy-1", "missing"),
    (err: Error) => err.name === "NotFoundError",
  );
});

test("cancel: status → 'cancelled', cancelledAt установлен в now", async () => {
  const existing = baseRow({ id: "asg-1", status: "pending" });
  const { module, store, rows } = makeModule({ existing: [existing] });

  const before = Date.now();
  const result = await module.cancelAssignment("psy-1", "asg-1");
  const after = Date.now();

  assert.equal(result.status, "cancelled");
  assert.ok(result.cancelledAt instanceof Date);
  assert.ok(result.cancelledAt.getTime() >= before);
  assert.ok(result.cancelledAt.getTime() <= after);

  // persisted
  const persisted = rows.get("asg-1");
  assert.equal(persisted?.status, "cancelled");
  assert.equal(store.updates.length, 1);
});
