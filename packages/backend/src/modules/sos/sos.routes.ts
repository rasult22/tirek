import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { sosService } from "./sos.service.js";

// ── Student routes (mounted under student prefix) ──────────────────
const sosStudentRouter = new Hono<{ Variables: AppVariables }>();

// POST /sos - trigger SOS
sosStudentRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const result = await sosService.trigger(c.var.user.userId, body);
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// ── Psychologist routes (mounted under psychologist prefix) ─────────
const sosPsychologistRouter = new Hono<{ Variables: AppVariables }>();

// GET /sos/active - active SOS events
sosPsychologistRouter.get("/active", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await sosService.getActive(c.var.user.userId, pagination);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// PATCH /sos/:id/resolve - resolve SOS event
sosPsychologistRouter.patch("/:id/resolve", async (c) => {
  try {
    const body = await c.req.json();
    const result = await sosService.resolve(
      c.var.user.userId,
      c.req.param("id"),
      body,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /sos/history - SOS history
sosPsychologistRouter.get("/history", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await sosService.getHistory(c.var.user.userId, pagination);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

export { sosStudentRouter, sosPsychologistRouter };
