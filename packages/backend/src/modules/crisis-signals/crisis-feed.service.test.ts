import { test } from "node:test";
import assert from "node:assert/strict";

import { createCrisisFeedService } from "./crisis-feed.service.js";
import type {
  CrisisFeedDeps,
  PersistedSignalRow,
  ResolveInput,
} from "./crisis-feed.service.js";

type Fakes = {
  rows: PersistedSignalRow[];
  resolves: Array<{ id: string; input: ResolveInput }>;
};

function makeService(
  initialRows: PersistedSignalRow[] = [],
  overrides: Partial<CrisisFeedDeps> = {},
) {
  const fakes: Fakes = {
    rows: [...initialRows],
    resolves: [],
  };
  const deps: CrisisFeedDeps = {
    findByPsychologistAndType: async (psychologistId, type, options) => {
      const matches = fakes.rows
        .filter(
          (r) =>
            r.linkedPsychologistIds.includes(psychologistId) &&
            r.type === type &&
            (options.onlyActive ? r.resolvedAt === null : true),
        )
        .map((r) => ({ ...r }));
      return matches;
    },
    findHistoryByPsychologist: async (psychologistId) => {
      return fakes.rows
        .filter(
          (r) =>
            r.linkedPsychologistIds.includes(psychologistId) &&
            r.resolvedAt !== null,
        )
        .map((r) => ({ ...r }));
    },
    findById: async (id) => {
      const row = fakes.rows.find((r) => r.id === id);
      return row ? { ...row } : null;
    },
    resolveSignal: async (id, input) => {
      fakes.resolves.push({ id, input });
      const row = fakes.rows.find((r) => r.id === id);
      if (!row) throw new Error("not found in fake");
      row.resolvedAt = input.resolvedAt;
      row.resolvedBy = input.resolvedBy;
      row.resolutionNotes = input.notes;
      row.contactedStudent = input.contactedStudent;
      row.contactedParent = input.contactedParent;
      row.documented = input.documented;
      return { ...row };
    },
    now: () => new Date("2026-04-26T12:00:00.000Z"),
    ...overrides,
  };
  return { service: createCrisisFeedService(deps), fakes };
}

function row(partial: Partial<PersistedSignalRow>): PersistedSignalRow {
  return {
    id: partial.id ?? "sig-x",
    studentId: partial.studentId ?? "stu-1",
    studentName: partial.studentName ?? "Иван Иванов",
    studentGrade: partial.studentGrade ?? 9,
    studentClassLetter: partial.studentClassLetter ?? "А",
    type: partial.type ?? "acute_crisis",
    severity: partial.severity ?? "high",
    source: partial.source ?? "ai_friend",
    summary: partial.summary ?? "summary",
    metadata: partial.metadata ?? null,
    createdAt: partial.createdAt ?? new Date("2026-04-26T10:00:00.000Z"),
    resolvedAt: partial.resolvedAt ?? null,
    resolvedBy: partial.resolvedBy ?? null,
    resolutionNotes: partial.resolutionNotes ?? null,
    contactedStudent: partial.contactedStudent ?? false,
    contactedParent: partial.contactedParent ?? false,
    documented: partial.documented ?? false,
    linkedPsychologistIds: partial.linkedPsychologistIds ?? ["psy-1"],
  };
}

// ── Test 1: Red Feed returns active acute_crisis sorted newest first ────
test("getRedFeed_returns_only_active_acute_crisis_sorted_newest_first", async () => {
  const older = row({
    id: "sig-old",
    type: "acute_crisis",
    createdAt: new Date("2026-04-26T08:00:00.000Z"),
  });
  const newer = row({
    id: "sig-new",
    type: "acute_crisis",
    createdAt: new Date("2026-04-26T11:00:00.000Z"),
  });
  const { service } = makeService([older, newer]);

  const result = await service.getRedFeed("psy-1");

  assert.equal(result.length, 2);
  assert.equal(result[0].id, "sig-new");
  assert.equal(result[1].id, "sig-old");
});

// ── Test 3: Red Feed excludes other psychologists' students ─────────────
test("getRedFeed_excludes_signals_from_other_psychologists_students", async () => {
  const mine = row({ id: "sig-mine", linkedPsychologistIds: ["psy-1"] });
  const someoneElse = row({
    id: "sig-other",
    linkedPsychologistIds: ["psy-2"],
  });
  const { service } = makeService([mine, someoneElse]);

  const result = await service.getRedFeed("psy-1");

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "sig-mine");
});

// ── Test 2: Red Feed excludes resolved signals ─────────────────────────
test("getRedFeed_excludes_resolved_signals", async () => {
  const active = row({ id: "sig-active", type: "acute_crisis" });
  const resolved = row({
    id: "sig-resolved",
    type: "acute_crisis",
    resolvedAt: new Date("2026-04-26T09:00:00.000Z"),
    resolvedBy: "psy-1",
  });
  const { service } = makeService([active, resolved]);

  const result = await service.getRedFeed("psy-1");

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "sig-active");
});

// ── Test 5: resolve marks signal with checklist + notes + actor ─────────
test("resolve_marks_signal_with_checklist_notes_and_resolvedBy", async () => {
  const active = row({ id: "sig-1", type: "acute_crisis" });
  const { service, fakes } = makeService([active]);

  const resolved = await service.resolve("psy-1", "sig-1", {
    notes: "Связалась с учеником и родителем, всё стабилизировано.",
    contactedStudent: true,
    contactedParent: true,
    documented: true,
  });

  assert.equal(fakes.resolves.length, 1);
  assert.equal(fakes.resolves[0].id, "sig-1");
  assert.equal(fakes.resolves[0].input.resolvedBy, "psy-1");
  assert.equal(fakes.resolves[0].input.contactedStudent, true);
  assert.equal(fakes.resolves[0].input.contactedParent, true);
  assert.equal(fakes.resolves[0].input.documented, true);
  assert.equal(
    fakes.resolves[0].input.notes,
    "Связалась с учеником и родителем, всё стабилизировано.",
  );
  assert.equal(
    fakes.resolves[0].input.resolvedAt.toISOString(),
    "2026-04-26T12:00:00.000Z",
  );
  assert.equal(resolved.resolvedBy, "psy-1");
});

// ── Test 6: resolving an already-resolved signal throws ValidationError ─
test("resolve_throws_validation_error_when_signal_already_resolved", async () => {
  const already = row({
    id: "sig-1",
    resolvedAt: new Date("2026-04-26T09:00:00.000Z"),
    resolvedBy: "psy-1",
  });
  const { service, fakes } = makeService([already]);

  await assert.rejects(
    () => service.resolve("psy-1", "sig-1", { notes: "" }),
    (err: Error) => err.name === "ValidationError",
  );
  assert.equal(fakes.resolves.length, 0);
});

// ── Test 7: resolving a missing signal throws NotFoundError ─────────────
test("resolve_throws_not_found_when_signal_missing", async () => {
  const { service } = makeService([]);

  await assert.rejects(
    () => service.resolve("psy-1", "missing-id", { notes: null }),
    (err: Error) => err.name === "NotFoundError",
  );
});

// ── Test 8: cannot resolve another psychologist's student's signal ──────
test("resolve_throws_not_found_when_signal_belongs_to_other_psychologists_student", async () => {
  const other = row({
    id: "sig-other",
    linkedPsychologistIds: ["psy-2"],
  });
  const { service, fakes } = makeService([other]);

  await assert.rejects(
    () => service.resolve("psy-1", "sig-other", { notes: null }),
    (err: Error) => err.name === "NotFoundError",
  );
  assert.equal(fakes.resolves.length, 0);
});

// ── Test 9: getHistory returns only resolved signals, newest-resolved first
test("getHistory_returns_only_resolved_signals_sorted_by_resolvedAt_desc", async () => {
  const active = row({ id: "sig-active" });
  const resolvedOlder = row({
    id: "sig-resolved-old",
    resolvedAt: new Date("2026-04-26T08:00:00.000Z"),
    resolvedBy: "psy-1",
  });
  const resolvedNewer = row({
    id: "sig-resolved-new",
    resolvedAt: new Date("2026-04-26T11:00:00.000Z"),
    resolvedBy: "psy-1",
  });
  const otherStudent = row({
    id: "sig-other",
    linkedPsychologistIds: ["psy-2"],
    resolvedAt: new Date("2026-04-26T11:30:00.000Z"),
  });
  const { service } = makeService([active, resolvedOlder, resolvedNewer, otherStudent]);

  const result = await service.getHistory("psy-1");

  assert.deepEqual(
    result.map((r) => r.id),
    ["sig-resolved-new", "sig-resolved-old"],
  );
});

// ── Test 4: Yellow Feed = concern, sort by severity then createdAt ──────
test("getYellowFeed_returns_concern_sorted_by_severity_then_newest_first", async () => {
  const lowOld = row({
    id: "sig-low-old",
    type: "concern",
    severity: "low",
    createdAt: new Date("2026-04-26T07:00:00.000Z"),
  });
  const highOld = row({
    id: "sig-high-old",
    type: "concern",
    severity: "high",
    createdAt: new Date("2026-04-26T08:00:00.000Z"),
  });
  const mediumNew = row({
    id: "sig-medium-new",
    type: "concern",
    severity: "medium",
    createdAt: new Date("2026-04-26T11:00:00.000Z"),
  });
  const highNew = row({
    id: "sig-high-new",
    type: "concern",
    severity: "high",
    createdAt: new Date("2026-04-26T10:00:00.000Z"),
  });
  // Should NOT appear: acute_crisis is Red Feed.
  const acute = row({ id: "sig-acute", type: "acute_crisis" });
  const { service } = makeService([lowOld, highOld, mediumNew, highNew, acute]);

  const result = await service.getYellowFeed("psy-1");

  assert.deepEqual(
    result.map((r) => r.id),
    ["sig-high-new", "sig-high-old", "sig-medium-new", "sig-low-old"],
  );
});
