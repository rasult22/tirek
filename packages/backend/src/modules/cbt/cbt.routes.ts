import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { cbtService } from "./cbt.service.js";

// ── Student router ─────────────────────────────────────────────────
export const cbtStudentRouter = new Hono<{ Variables: AppVariables }>();

// GET / — list CBT entries (paginated, optional type filter)
cbtStudentRouter.get("/", async (c) => {
  try {
    const pagination = parsePagination(c);
    const type = c.req.query("type") || undefined;
    const result = await cbtService.list(c.var.user.userId, pagination, type);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// POST / — create CBT entry
cbtStudentRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const result = await cbtService.create(c.var.user.userId, body);
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// PUT /:id — update CBT entry
cbtStudentRouter.put("/:id", async (c) => {
  try {
    const body = await c.req.json();
    const result = await cbtService.update(
      c.var.user.userId,
      c.req.param("id"),
      body,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// DELETE /:id — delete CBT entry
cbtStudentRouter.delete("/:id", async (c) => {
  try {
    const result = await cbtService.delete(
      c.var.user.userId,
      c.req.param("id"),
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// ── Psychologist router ────────────────────────────────────────────
export const cbtPsychologistRouter = new Hono<{ Variables: AppVariables }>();

// GET /:studentId — view student's CBT entries
cbtPsychologistRouter.get("/:studentId", async (c) => {
  try {
    const pagination = parsePagination(c);
    const type = c.req.query("type") || undefined;
    const result = await cbtService.listForStudent(
      c.req.param("studentId"),
      pagination,
      type,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});
