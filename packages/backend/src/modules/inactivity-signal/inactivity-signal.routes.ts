import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { inactivitySignalService } from "./inactivity-signal.service.js";

const inactivitySignalRouter = new Hono<{ Variables: AppVariables }>();

// GET /inactive-students?threshold=3
inactivitySignalRouter.get("/inactive-students", async (c) => {
  try {
    const thresholdParam = c.req.query("threshold");
    const threshold =
      thresholdParam !== undefined ? Number.parseInt(thresholdParam, 10) : undefined;
    const result = await inactivitySignalService.getInactiveStudents(
      c.var.user.userId,
      Number.isFinite(threshold) ? threshold : undefined,
    );
    return c.json({ data: result });
  } catch (err) {
    return handleError(c, err);
  }
});

export { inactivitySignalRouter };
