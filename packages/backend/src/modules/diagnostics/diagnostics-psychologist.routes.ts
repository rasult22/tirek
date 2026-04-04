import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { diagnosticsService } from "./diagnostics.service.js";

const diagnosticsPsychologistRouter = new Hono<{
  Variables: AppVariables;
}>();

// GET /results - all test results for psychologist's students
diagnosticsPsychologistRouter.get("/results", async (c) => {
  try {
    const studentId = c.req.query("studentId");
    const pagination = parsePagination(c);
    const result = await diagnosticsService.getResultsForPsychologist(
      c.var.user.userId,
      pagination,
      { studentId },
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /assign - assign a test to student or class
diagnosticsPsychologistRouter.post("/assign", async (c) => {
  try {
    const body = await c.req.json();
    const result = await diagnosticsService.assignTest(
      c.var.user.userId,
      body,
    );
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

export { diagnosticsPsychologistRouter };
