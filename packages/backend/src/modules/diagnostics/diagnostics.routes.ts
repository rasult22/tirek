import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { diagnosticsService } from "./diagnostics.service.js";

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
    const user = c.var.user;
    const result = await diagnosticsService.getAssignedTests(
      user.userId,
      (user as any).grade ?? null,
      (user as any).classLetter ?? null,
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
