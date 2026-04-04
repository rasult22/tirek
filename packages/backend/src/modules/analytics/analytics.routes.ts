import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { analyticsService } from "./analytics.service.js";

const analyticsRouter = new Hono<{ Variables: AppVariables }>();

// GET /analytics/overview - dashboard stats
analyticsRouter.get("/overview", async (c) => {
  try {
    const result = await analyticsService.getOverview(c.var.user.userId);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /analytics/students/:id - student report
analyticsRouter.get("/students/:id", async (c) => {
  try {
    const result = await analyticsService.getStudentReport(
      c.var.user.userId,
      c.req.param("id"),
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /analytics/class - class report
analyticsRouter.get("/class", async (c) => {
  try {
    const gradeParam = c.req.query("grade");
    const classLetter = c.req.query("classLetter");

    const result = await analyticsService.getClassReport(
      c.var.user.userId,
      gradeParam ? parseInt(gradeParam, 10) : undefined,
      classLetter || undefined,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

export { analyticsRouter };
