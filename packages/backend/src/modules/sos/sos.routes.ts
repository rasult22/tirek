import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
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

export { sosStudentRouter };
