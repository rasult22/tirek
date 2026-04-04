import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { exercisesService } from "./exercises.service.js";

const exercisesRouter = new Hono<{ Variables: AppVariables }>();

// GET /exercises
exercisesRouter.get("/", async (c) => {
  try {
    const result = await exercisesService.list();
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /exercises/history
exercisesRouter.get("/history", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await exercisesService.getHistory(c.var.user.userId, pagination);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /exercises/:id/complete
exercisesRouter.post("/:id/complete", async (c) => {
  try {
    const exerciseId = c.req.param("id");
    const body = await c.req.json();
    const result = await exercisesService.complete(
      c.var.user.userId,
      exerciseId,
      body,
    );
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

export { exercisesRouter };
