import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { diagnosticsService } from "./diagnostics.service.js";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";

const diagnosticsRouter = new Hono<{ Variables: AppVariables }>();

// GET /tests
diagnosticsRouter.get("/", async (c) => {
  try {
    const result = await diagnosticsService.getAvailableTests(
      c.var.user.userId,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /tests/assigned
diagnosticsRouter.get("/assigned", async (c) => {
  try {
    const userId = c.var.user.userId;
    // Fetch grade/classLetter from DB since JWT doesn't include them
    const [student] = await db
      .select({ grade: users.grade, classLetter: users.classLetter })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const result = await diagnosticsService.getAssignedTests(
      userId,
      student?.grade ?? null,
      student?.classLetter ?? null,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /tests/:testId/start
diagnosticsRouter.post("/:testId/start", async (c) => {
  try {
    const testId = c.req.param("testId");
    const result = await diagnosticsService.startSession(
      c.var.user.userId,
      testId,
    );
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /tests/sessions/:sessionId/answer
diagnosticsRouter.post("/sessions/:sessionId/answer", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const body = await c.req.json();
    const result = await diagnosticsService.submitAnswer(
      c.var.user.userId,
      sessionId,
      body,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /tests/sessions/:sessionId/complete
diagnosticsRouter.post("/sessions/:sessionId/complete", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const result = await diagnosticsService.completeSession(
      c.var.user.userId,
      sessionId,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /tests/sessions/:sessionId
diagnosticsRouter.get("/sessions/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const result = await diagnosticsService.getSessionResult(
      c.var.user.userId,
      sessionId,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /tests/history
diagnosticsRouter.get("/history", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await diagnosticsService.getHistory(c.var.user.userId, pagination);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

export { diagnosticsRouter };
