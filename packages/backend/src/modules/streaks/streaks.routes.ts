import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { streaksService } from "./streaks.service.js";

export const streaksRouter = new Hono<{ Variables: AppVariables }>();

// GET / — get current streak for authenticated user
streaksRouter.get("/", async (c) => {
  try {
    const result = await streaksService.getStreak(c.var.user.userId);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});
