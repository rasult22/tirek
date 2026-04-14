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

// GET /sessions/:sessionId/report - AI-generated report for a session
diagnosticsPsychologistRouter.get("/sessions/:sessionId/report", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const report = await diagnosticsService.getAiReportForPsychologist(
      c.var.user.userId,
      sessionId,
    );
    // If still generating, return 202 so the client knows to keep polling.
    if (report.status === "pending") {
      return c.json(report, 202);
    }
    return c.json(report);
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /sessions/:sessionId/report/regenerate - trigger a fresh generation
diagnosticsPsychologistRouter.post(
  "/sessions/:sessionId/report/regenerate",
  async (c) => {
    try {
      const sessionId = c.req.param("sessionId");
      const result = await diagnosticsService.regenerateAiReport(
        c.var.user.userId,
        sessionId,
      );
      return c.json(result, 202);
    } catch (err) {
      return handleError(c, err);
    }
  },
);

// GET /sessions/:sessionId/answers - per-item answers with question text
diagnosticsPsychologistRouter.get("/sessions/:sessionId/answers", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const result = await diagnosticsService.getSessionAnswersForPsychologist(
      c.var.user.userId,
      sessionId,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

export { diagnosticsPsychologistRouter };
