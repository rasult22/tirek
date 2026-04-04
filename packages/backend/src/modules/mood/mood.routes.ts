import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { moodService } from "./mood.service.js";

const moodRouter = new Hono<{ Variables: AppVariables }>();

// POST /mood
moodRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const result = await moodService.createEntry(c.var.user.userId, body);
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /mood/today
moodRouter.get("/today", async (c) => {
  try {
    const result = await moodService.getToday(c.var.user.userId);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /mood/calendar?year=2026&month=4
moodRouter.get("/calendar", async (c) => {
  try {
    const year = Number(c.req.query("year"));
    const month = Number(c.req.query("month"));
    const result = await moodService.getCalendar(c.var.user.userId, year, month);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /mood/insights
moodRouter.get("/insights", async (c) => {
  try {
    const result = await moodService.getInsights(c.var.user.userId);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

export { moodRouter };
