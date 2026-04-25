import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { officeHoursService } from "./office-hours.service.js";

// ── Shared routes (mounted at /office-hours) ──────────────────────
// Readable by any authenticated user; Student usually queries their linked
// psychologist, Psychologist queries own schedule.

const officeHoursRouter = new Hono<{ Variables: AppVariables }>();

// GET /office-hours/student/info-block — computed view for the caller's linked psychologist.
// Declared before /:psychologistId so the path prefix takes precedence.
officeHoursRouter.get("/student/info-block", async (c) => {
  try {
    const block = await officeHoursService.infoBlockForStudent(c.var.user.userId);
    return c.json(block);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /office-hours/:psychologistId?date=YYYY-MM-DD
// GET /office-hours/:psychologistId?from=YYYY-MM-DD&to=YYYY-MM-DD
officeHoursRouter.get("/:psychologistId", async (c) => {
  try {
    const psychologistId = c.req.param("psychologistId");
    const date = c.req.query("date");
    const from = c.req.query("from");
    const to = c.req.query("to");

    if (date) {
      const row = await officeHoursService.getByDate(psychologistId, date);
      return c.json(row);
    }
    if (from && to) {
      const rows = await officeHoursService.getRange(psychologistId, from, to);
      return c.json(rows);
    }
    return c.json({ error: "Provide ?date= or ?from=&to=" }, 400);
  } catch (err) {
    return handleError(c, err);
  }
});

// ── Psychologist routes (mounted at /psychologist/office-hours) ───

const officeHoursPsychologistRouter = new Hono<{ Variables: AppVariables }>();

// PUT / — upsert own schedule for a specific date
officeHoursPsychologistRouter.put("/", async (c) => {
  try {
    const body = await c.req.json();
    const row = await officeHoursService.upsertDay(c.var.user.userId, body);
    return c.json(row);
  } catch (err) {
    return handleError(c, err);
  }
});

export { officeHoursRouter, officeHoursPsychologistRouter };
