// Должно стоять до импорта env-зависимых модулей.
process.env.JWT_SECRET ??= "test-secret-must-be-at-least-32-characters-long";

import { test } from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";

import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import type { JwtPayload } from "../../lib/jwt.js";
import { createOfficeHoursService } from "./office-hours.factory.js";
import type {
  OfficeHoursDeps,
  TemplateRecord,
  OverrideRecord,
} from "./office-hours.factory.js";
import { createOfficeHoursRouters } from "./office-hours.routes.factory.js";

// ── Test infrastructure ──────────────────────────────────────────────
// Контракт-тесты HTTP-слоя через in-process Hono. Поднимаем минимальный
// app: фейковый auth-middleware (выставляет c.var.user) + смонтированные
// office-hours роуты на сервисе с DI-фейками. Без БД, без JWT.

type Fakes = {
  templates: TemplateRecord[];
  overrides: OverrideRecord[];
};

type AppOpts = {
  user?: JwtPayload;
  serviceOverrides?: Partial<OfficeHoursDeps>;
  seed?: Partial<Fakes>;
};

function makeApp(opts: AppOpts = {}) {
  const fakes: Fakes = {
    templates: opts.seed?.templates ?? [],
    overrides: opts.seed?.overrides ?? [],
  };

  const deps: OfficeHoursDeps = {
    findTemplateByPsychologist: async (psychologistId) =>
      fakes.templates.filter((t) => t.psychologistId === psychologistId),
    upsertTemplateDay: async (data) => {
      const idx = fakes.templates.findIndex(
        (t) => t.psychologistId === data.psychologistId && t.dayOfWeek === data.dayOfWeek,
      );
      const row: TemplateRecord = {
        id: idx >= 0 ? fakes.templates[idx]!.id : `tpl-${fakes.templates.length + 1}`,
        psychologistId: data.psychologistId,
        dayOfWeek: data.dayOfWeek,
        intervals: data.intervals,
        notes: data.notes,
        updatedAt: new Date("2026-04-28T10:00:00.000Z"),
      };
      if (idx >= 0) fakes.templates[idx] = row;
      else fakes.templates.push(row);
      return row;
    },
    findOverridesByRange: async (psychologistId, from, to) =>
      fakes.overrides
        .filter((o) => o.psychologistId === psychologistId && o.date >= from && o.date <= to)
        .sort((a, b) => a.date.localeCompare(b.date)),
    upsertOverrideDay: async (data) => {
      const idx = fakes.overrides.findIndex(
        (o) => o.psychologistId === data.psychologistId && o.date === data.date,
      );
      const row: OverrideRecord = {
        id: idx >= 0 ? fakes.overrides[idx]!.id : `ovr-${fakes.overrides.length + 1}`,
        psychologistId: data.psychologistId,
        date: data.date,
        intervals: data.intervals,
        notes: data.notes,
        updatedAt: new Date("2026-04-28T10:00:00.000Z"),
      };
      if (idx >= 0) fakes.overrides[idx] = row;
      else fakes.overrides.push(row);
      return row;
    },
    deleteOverrideDay: async (psychologistId, date) => {
      const idx = fakes.overrides.findIndex(
        (o) => o.psychologistId === psychologistId && o.date === date,
      );
      if (idx < 0) return false;
      fakes.overrides.splice(idx, 1);
      return true;
    },
    findStudentPsychologistLink: async () => null,
    ...opts.serviceOverrides,
  };

  const service = createOfficeHoursService(deps);
  const { officeHoursRouter, officeHoursPsychologistRouter } =
    createOfficeHoursRouters(service);

  const app = new Hono<{ Variables: AppVariables }>();

  // Фейковый auth-middleware: подсаживает выбранного пользователя в c.var.user.
  // Если user не задан — оставляем поведение продакшена (через 401 от роутера),
  // но тут мы не тестируем сам auth.ts — только контракт роутов.
  app.use("*", async (c, next) => {
    if (opts.user) c.set("user", opts.user);
    await next();
  });

  app.route("/office-hours", officeHoursRouter);
  app.route("/psychologist/office-hours", officeHoursPsychologistRouter);

  app.onError((err, c) => handleError(c, err));

  return { app, fakes };
}

function psy(userId = "psy-1"): JwtPayload {
  return { userId, email: `${userId}@test`, role: "psychologist" };
}

function student(userId = "stu-1"): JwtPayload {
  return { userId, email: `${userId}@test`, role: "student" };
}

// ── T-R1: GET /psychologist/office-hours/template ────────────────────

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

test("T-R1: GET /psychologist/office-hours/template — 200 с массивом строк психолога", async () => {
  const { app } = makeApp({
    user: psy("psy-1"),
    seed: {
      templates: [
        {
          id: "tpl-1",
          psychologistId: "psy-1",
          dayOfWeek: 1,
          intervals: [{ start: "09:00", end: "17:00" }],
          notes: null,
          updatedAt: new Date("2026-04-28T10:00:00.000Z"),
        },
        {
          id: "tpl-2",
          psychologistId: "psy-1",
          dayOfWeek: 3,
          intervals: [{ start: "14:00", end: "17:00" }],
          notes: "среда онлайн",
          updatedAt: new Date("2026-04-28T10:00:00.000Z"),
        },
        // чужой психолог — не должен утечь
        {
          id: "tpl-other",
          psychologistId: "psy-2",
          dayOfWeek: 1,
          intervals: [{ start: "08:00", end: "09:00" }],
          notes: null,
          updatedAt: new Date("2026-04-28T10:00:00.000Z"),
        },
      ],
    },
  });

  const res = await app.request("/psychologist/office-hours/template");

  assert.equal(res.status, 200);
  const body = (await res.json()) as Array<{ dayOfWeek: number; psychologistId: string }>;
  assert.equal(body.length, 2);
  assert.ok(body.every((r) => r.psychologistId === "psy-1"));
  assert.deepEqual(
    body.map((r) => r.dayOfWeek).sort(),
    [1, 3],
  );
});

// ── T-R2: PUT /psychologist/office-hours/template/:dayOfWeek ─────────

test("T-R2a: PUT template/:dayOfWeek — 200, апсертит и возвращает строку", async () => {
  const { app, fakes } = makeApp({ user: psy("psy-1") });

  const res = await app.request(
    "/psychologist/office-hours/template/1",
    jsonInit("PUT", { intervals: [{ start: "09:00", end: "12:00" }], notes: "утро" }),
  );

  assert.equal(res.status, 200);
  const row = (await res.json()) as {
    psychologistId: string;
    dayOfWeek: number;
    intervals: Array<{ start: string; end: string }>;
    notes: string | null;
  };
  assert.equal(row.psychologistId, "psy-1");
  assert.equal(row.dayOfWeek, 1);
  assert.deepEqual(row.intervals, [{ start: "09:00", end: "12:00" }]);
  assert.equal(row.notes, "утро");
  assert.equal(fakes.templates.length, 1, "должна появиться одна строка");
});

test("T-R2b: PUT template/:dayOfWeek — :dayOfWeek=foo → 400 ValidationError", async () => {
  const { app, fakes } = makeApp({ user: psy("psy-1") });

  const res = await app.request(
    "/psychologist/office-hours/template/foo",
    jsonInit("PUT", { intervals: [{ start: "09:00", end: "12:00" }] }),
  );

  assert.equal(res.status, 400);
  assert.equal(fakes.templates.length, 0, "БД не должна быть тронута");
});

test("T-R2c: PUT template/:dayOfWeek — overlapping intervals → 400", async () => {
  const { app } = makeApp({ user: psy("psy-1") });

  const res = await app.request(
    "/psychologist/office-hours/template/1",
    jsonInit("PUT", {
      intervals: [
        { start: "09:00", end: "12:00" },
        { start: "11:00", end: "13:00" },
      ],
    }),
  );

  assert.equal(res.status, 400);
});

// ── T-R3: GET /psychologist/office-hours/override ────────────────────

test("T-R3a: GET override?from&to — 200 с overrides своего психолога в диапазоне", async () => {
  const { app } = makeApp({
    user: psy("psy-1"),
    seed: {
      overrides: [
        {
          id: "o-in",
          psychologistId: "psy-1",
          date: "2026-04-27",
          intervals: [{ start: "14:00", end: "16:00" }],
          notes: null,
          updatedAt: new Date("2026-04-28T10:00:00.000Z"),
        },
        {
          id: "o-out-of-range",
          psychologistId: "psy-1",
          date: "2026-05-15",
          intervals: [],
          notes: null,
          updatedAt: new Date("2026-04-28T10:00:00.000Z"),
        },
        {
          id: "o-other-psy",
          psychologistId: "psy-2",
          date: "2026-04-27",
          intervals: [{ start: "08:00", end: "09:00" }],
          notes: null,
          updatedAt: new Date("2026-04-28T10:00:00.000Z"),
        },
      ],
    },
  });

  const res = await app.request(
    "/psychologist/office-hours/override?from=2026-04-26&to=2026-04-30",
  );

  assert.equal(res.status, 200);
  const body = (await res.json()) as Array<{ id: string; date: string }>;
  assert.equal(body.length, 1);
  assert.equal(body[0]!.id, "o-in");
});

test("T-R3b: GET override без from → 400 ValidationError", async () => {
  const { app } = makeApp({ user: psy("psy-1") });

  const res = await app.request("/psychologist/office-hours/override?to=2026-04-30");

  assert.equal(res.status, 400);
});

test("T-R3c: GET override с from > to → 400", async () => {
  const { app } = makeApp({ user: psy("psy-1") });

  const res = await app.request(
    "/psychologist/office-hours/override?from=2026-04-30&to=2026-04-25",
  );

  assert.equal(res.status, 400);
});

// ── T-R4: PUT /psychologist/office-hours/override/:date ──────────────

test("T-R4a: PUT override/:date — 200, апсертит выходной (intervals=[])", async () => {
  const { app, fakes } = makeApp({ user: psy("psy-1") });

  const res = await app.request(
    "/psychologist/office-hours/override/2026-04-30",
    jsonInit("PUT", { intervals: [], notes: "конференция" }),
  );

  assert.equal(res.status, 200);
  const row = (await res.json()) as {
    psychologistId: string;
    date: string;
    intervals: unknown[];
    notes: string | null;
  };
  assert.equal(row.psychologistId, "psy-1");
  assert.equal(row.date, "2026-04-30");
  assert.deepEqual(row.intervals, []);
  assert.equal(row.notes, "конференция");
  assert.equal(fakes.overrides.length, 1);
});

test("T-R4b: PUT override/:date — невалидный формат даты → 400", async () => {
  const { app, fakes } = makeApp({ user: psy("psy-1") });

  const res = await app.request(
    "/psychologist/office-hours/override/30-04-2026",
    jsonInit("PUT", { intervals: [] }),
  );

  assert.equal(res.status, 400);
  assert.equal(fakes.overrides.length, 0);
});

// ── T-R5: DELETE /psychologist/office-hours/override/:date ───────────

test("T-R5a: DELETE override/:date — 200 success и строка удалена", async () => {
  const { app, fakes } = makeApp({
    user: psy("psy-1"),
    seed: {
      overrides: [
        {
          id: "o1",
          psychologistId: "psy-1",
          date: "2026-04-30",
          intervals: [],
          notes: null,
          updatedAt: new Date("2026-04-28T10:00:00.000Z"),
        },
      ],
    },
  });

  const res = await app.request("/psychologist/office-hours/override/2026-04-30", {
    method: "DELETE",
  });

  assert.equal(res.status, 200);
  const body = (await res.json()) as { success: boolean };
  assert.equal(body.success, true);
  assert.equal(fakes.overrides.length, 0);
});

test("T-R5b: DELETE override/:date — отсутствующий override → 404 NotFoundError", async () => {
  const { app } = makeApp({ user: psy("psy-1") });

  const res = await app.request("/psychologist/office-hours/override/2026-04-30", {
    method: "DELETE",
  });

  assert.equal(res.status, 404);
});

test("T-R5c: DELETE override/:date — чужой override (другого психолога) → 404", async () => {
  const { app, fakes } = makeApp({
    user: psy("psy-1"),
    seed: {
      overrides: [
        {
          id: "o-other",
          psychologistId: "psy-2",
          date: "2026-04-30",
          intervals: [],
          notes: null,
          updatedAt: new Date("2026-04-28T10:00:00.000Z"),
        },
      ],
    },
  });

  const res = await app.request("/psychologist/office-hours/override/2026-04-30", {
    method: "DELETE",
  });

  assert.equal(res.status, 404);
  assert.equal(fakes.overrides.length, 1, "чужая строка не должна удалиться");
});

// ── T-R6: GET /office-hours/resolve ──────────────────────────────────

test("T-R6a: GET /office-hours/resolve — студент к своему психологу → 200, возвращает резолв", async () => {
  const { app } = makeApp({
    user: student("stu-1"),
    serviceOverrides: {
      findStudentPsychologistLink: async (studentId) => {
        if (studentId === "stu-1")
          return { studentId, psychologistId: "psy-1", psychologistName: "Анна Петровна" };
        return null;
      },
    },
    seed: {
      templates: [
        {
          id: "t1",
          psychologistId: "psy-1",
          dayOfWeek: 1,
          intervals: [{ start: "09:00", end: "17:00" }],
          notes: null,
          updatedAt: new Date("2026-04-28T10:00:00.000Z"),
        },
      ],
    },
  });

  const res = await app.request(
    "/office-hours/resolve?date=2026-04-27&psychologistId=psy-1",
  );

  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    intervals: Array<{ start: string; end: string }>;
    source: string;
  };
  assert.equal(body.source, "template");
  assert.deepEqual(body.intervals, [{ start: "09:00", end: "17:00" }]);
});

test("T-R6b: GET /office-hours/resolve — студент к чужому психологу → 403", async () => {
  const { app } = makeApp({
    user: student("stu-1"),
    serviceOverrides: {
      findStudentPsychologistLink: async (studentId) => {
        if (studentId === "stu-1")
          return { studentId, psychologistId: "psy-1", psychologistName: "Анна Петровна" };
        return null;
      },
    },
  });

  const res = await app.request(
    "/office-hours/resolve?date=2026-04-27&psychologistId=psy-2",
  );

  assert.equal(res.status, 403);
});

test("T-R6c: GET /office-hours/resolve — психолог к своему ID → 200", async () => {
  const { app } = makeApp({
    user: psy("psy-1"),
    seed: {
      templates: [
        {
          id: "t1",
          psychologistId: "psy-1",
          dayOfWeek: 1,
          intervals: [{ start: "09:00", end: "17:00" }],
          notes: null,
          updatedAt: new Date("2026-04-28T10:00:00.000Z"),
        },
      ],
    },
  });

  const res = await app.request(
    "/office-hours/resolve?date=2026-04-27&psychologistId=psy-1",
  );

  assert.equal(res.status, 200);
});

test("T-R6d: GET /office-hours/resolve — психолог к чужому ID → 403", async () => {
  const { app } = makeApp({ user: psy("psy-1") });

  const res = await app.request(
    "/office-hours/resolve?date=2026-04-27&psychologistId=psy-2",
  );

  assert.equal(res.status, 403);
});

test("T-R6e: GET /office-hours/resolve — без обязательных query → 400", async () => {
  const { app } = makeApp({ user: psy("psy-1") });

  const noDate = await app.request("/office-hours/resolve?psychologistId=psy-1");
  assert.equal(noDate.status, 400);

  const noPsy = await app.request("/office-hours/resolve?date=2026-04-27");
  assert.equal(noPsy.status, 400);
});

// ── T-R7: GET /office-hours/student/info-block ───────────────────────

test("T-R7a: GET /office-hours/student/info-block — линкованный студент → 200 с InfoBlock и psychologist {id,name}", async () => {
  const { app } = makeApp({
    user: student("stu-1"),
    serviceOverrides: {
      findStudentPsychologistLink: async (studentId) => {
        if (studentId === "stu-1")
          return { studentId, psychologistId: "psy-1", psychologistName: "Анна Петровна" };
        return null;
      },
    },
    // Без шаблона/оверрайдов — тогда info-block — day_off_today.
  });

  const res = await app.request("/office-hours/student/info-block");

  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    kind: string;
    psychologist: { id: string; name: string };
  };
  // Конкретный kind зависит от текущего времени; важно, что роут не падает
  // и возвращает валидный discriminated union + блок данных психолога.
  assert.ok(
    ["available_now", "available_later_today", "finished_today", "day_off_today"].includes(
      body.kind,
    ),
    `unexpected kind: ${body.kind}`,
  );
  assert.deepEqual(body.psychologist, { id: "psy-1", name: "Анна Петровна" });
});

test("T-R7b: GET /office-hours/student/info-block — студент без линка → 404", async () => {
  const { app } = makeApp({
    user: student("stu-orphan"),
    // findStudentPsychologistLink по умолчанию возвращает null.
  });

  const res = await app.request("/office-hours/student/info-block");

  assert.equal(res.status, 404);
});

// ── T-R8: Auth-guard на /psychologist/office-hours/* ─────────────────
// Эти тесты используют ПРОДАКШЕН authMiddleware (а не подмену через c.set("user")),
// чтобы зафиксировать контракт: роуты office-hours действительно защищены.

async function makeAppWithRealAuth() {
  const { authMiddleware } = await import("../../middleware/auth.js");

  const service = createOfficeHoursService({
    findTemplateByPsychologist: async () => [],
    upsertTemplateDay: async () => {
      throw new Error("not used");
    },
    findOverridesByRange: async () => [],
    upsertOverrideDay: async () => {
      throw new Error("not used");
    },
    deleteOverrideDay: async () => false,
    findStudentPsychologistLink: async () => null,
  });
  const { officeHoursPsychologistRouter } = createOfficeHoursRouters(service);

  const app = new Hono<{ Variables: AppVariables }>();
  app.use("*", authMiddleware);
  app.route("/psychologist/office-hours", officeHoursPsychologistRouter);
  app.onError((err, c) => handleError(c, err));
  return app;
}

test("T-R8a: GET /psychologist/office-hours/template без Authorization → 401", async () => {
  const app = await makeAppWithRealAuth();

  const res = await app.request("/psychologist/office-hours/template");

  assert.equal(res.status, 401);
});

test("T-R8b: GET /psychologist/office-hours/template со student-токеном → 403", async () => {
  const app = await makeAppWithRealAuth();
  const { signToken } = await import("../../lib/jwt.js");
  const token = signToken({
    userId: "stu-1",
    email: "stu-1@test",
    role: "student",
  });

  const res = await app.request("/psychologist/office-hours/template", {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(res.status, 403);
});

test("T-R8c: GET /psychologist/office-hours/template с psychologist-токеном → 200", async () => {
  const app = await makeAppWithRealAuth();
  const { signToken } = await import("../../lib/jwt.js");
  const token = signToken({
    userId: "psy-1",
    email: "psy-1@test",
    role: "psychologist",
  });

  const res = await app.request("/psychologist/office-hours/template", {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(res.status, 200);
});

test("T-R8d: GET /psychologist/office-hours/template с невалидным токеном → 401", async () => {
  const app = await makeAppWithRealAuth();

  const res = await app.request("/psychologist/office-hours/template", {
    headers: { Authorization: "Bearer not-a-real-jwt" },
  });

  assert.equal(res.status, 401);
});
