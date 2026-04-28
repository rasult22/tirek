import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { ValidationError, handleError } from "../../shared/errors.js";
import type { OfficeHoursService } from "./office-hours.factory.js";

// ── Factory: даёт два роутера, привязанных к переданному сервису ─────
// Не имеет side-effect'ов на топ-уровне — безопасно импортировать в тестах
// без поднятия продакшен-зависимостей (env, БД, repository).

export function createOfficeHoursRouters(service: OfficeHoursService) {
  // ── Shared (mounted at /office-hours) ──────────────────────────────
  // Доступно любым авторизованным пользователям. Студент через /resolve
  // смотрит только своего психолога; психолог — только свой ID.

  const officeHoursRouter = new Hono<{ Variables: AppVariables }>();

  // GET /office-hours/student/info-block — computed view для линкованного психолога ученика.
  // Объявлен до /resolve, чтобы конкретный путь имел приоритет.
  officeHoursRouter.get("/student/info-block", async (c) => {
    try {
      const block = await service.infoBlockForStudent(c.var.user.userId);
      return c.json(block);
    } catch (err) {
      return handleError(c, err);
    }
  });

  // GET /office-hours/resolve?date=YYYY-MM-DD&psychologistId=X
  officeHoursRouter.get("/resolve", async (c) => {
    try {
      const date = c.req.query("date");
      const psychologistId = c.req.query("psychologistId");
      if (!date || !psychologistId) {
        throw new ValidationError("Both 'date' and 'psychologistId' query params are required");
      }
      const role = c.var.user.role as "student" | "psychologist" | "admin";
      const result = await service.resolveForDate(
        c.var.user.userId,
        role,
        psychologistId,
        date,
      );
      return c.json(result);
    } catch (err) {
      return handleError(c, err);
    }
  });

  // ── Psychologist (mounted at /psychologist/office-hours) ───────────

  const officeHoursPsychologistRouter = new Hono<{ Variables: AppVariables }>();

  // GET /psychologist/office-hours/template — собственный шаблон психолога
  officeHoursPsychologistRouter.get("/template", async (c) => {
    try {
      const rows = await service.getTemplate(c.var.user.userId);
      return c.json(rows);
    } catch (err) {
      return handleError(c, err);
    }
  });

  // PUT /psychologist/office-hours/template/:dayOfWeek — upsert на день недели
  officeHoursPsychologistRouter.put("/template/:dayOfWeek", async (c) => {
    try {
      const dayOfWeek = Number.parseInt(c.req.param("dayOfWeek"), 10);
      const body = await c.req.json();
      const row = await service.upsertTemplateDay(c.var.user.userId, dayOfWeek, body);
      return c.json(row);
    } catch (err) {
      return handleError(c, err);
    }
  });

  // GET /psychologist/office-hours/override?from=YYYY-MM-DD&to=YYYY-MM-DD
  officeHoursPsychologistRouter.get("/override", async (c) => {
    try {
      const from = c.req.query("from");
      const to = c.req.query("to");
      if (!from || !to) {
        throw new ValidationError("Both 'from' and 'to' query params are required");
      }
      const rows = await service.getOverrides(c.var.user.userId, from, to);
      return c.json(rows);
    } catch (err) {
      return handleError(c, err);
    }
  });

  // PUT /psychologist/office-hours/override/:date — upsert на дату
  officeHoursPsychologistRouter.put("/override/:date", async (c) => {
    try {
      const date = c.req.param("date");
      const body = await c.req.json();
      const row = await service.upsertOverrideDay(c.var.user.userId, date, body);
      return c.json(row);
    } catch (err) {
      return handleError(c, err);
    }
  });

  // DELETE /psychologist/office-hours/override/:date — удаление override
  officeHoursPsychologistRouter.delete("/override/:date", async (c) => {
    try {
      const date = c.req.param("date");
      await service.deleteOverrideDay(c.var.user.userId, date);
      return c.json({ success: true });
    } catch (err) {
      return handleError(c, err);
    }
  });

  return { officeHoursRouter, officeHoursPsychologistRouter };
}
