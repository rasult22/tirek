import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { achievementsService } from "./achievements.service.js";

// ── Student routes (/student/achievements) ──────────────────────────
const achievementsStudentRouter = new Hono<{ Variables: AppVariables }>();

// GET / — full achievement grid with earned status
achievementsStudentRouter.get("/", async (c) => {
  try {
    const result = await achievementsService.getUserAchievements(
      c.var.user.userId,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /summary — lightweight data for dashboard widget
achievementsStudentRouter.get("/summary", async (c) => {
  try {
    const result = await achievementsService.getUserSummary(
      c.var.user.userId,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// ── Psychologist routes (/psychologist/achievements) ────────────────
const achievementsPsychologistRouter = new Hono<{
  Variables: AppVariables;
}>();

// GET /:studentId — student's achievement grid (read-only)
achievementsPsychologistRouter.get("/:studentId", async (c) => {
  try {
    const studentId = c.req.param("studentId");
    const result =
      await achievementsService.getUserAchievements(studentId);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

export { achievementsStudentRouter, achievementsPsychologistRouter };
