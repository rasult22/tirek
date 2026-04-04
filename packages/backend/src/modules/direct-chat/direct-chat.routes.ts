import { Hono } from "hono";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { directChatService } from "./direct-chat.service.js";

// ── Student routes (mounted at /student/direct-chat) ────────────────

const directChatStudentRouter = new Hono<{ Variables: AppVariables }>();

directChatStudentRouter.get("/conversations", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await directChatService.getConversations(
      c.var.user.userId,
      "student",
      pagination,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

directChatStudentRouter.post("/conversations", async (c) => {
  try {
    const body = await c.req.json();
    const result = await directChatService.getOrCreateConversation(
      c.var.user.userId,
      "student",
      body.psychologistId,
    );
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

directChatStudentRouter.get("/conversations/:id/messages", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await directChatService.getMessages(
      c.var.user.userId,
      c.req.param("id"),
      pagination,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

directChatStudentRouter.post("/conversations/:id/messages", async (c) => {
  try {
    const body = await c.req.json();
    const result = await directChatService.sendMessage(
      c.var.user.userId,
      "student",
      c.req.param("id"),
      body,
    );
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

directChatStudentRouter.patch("/conversations/:id/read", async (c) => {
  try {
    await directChatService.markAsRead(c.var.user.userId, c.req.param("id"));
    return c.json({ ok: true });
  } catch (err) {
    return handleError(c, err);
  }
});

directChatStudentRouter.get("/unread-count", async (c) => {
  try {
    const result = await directChatService.getUnreadCount(c.var.user.userId);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

directChatStudentRouter.get("/my-psychologist", async (c) => {
  try {
    const result = await directChatService.getMyPsychologist(c.var.user.userId);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// ── Psychologist routes (mounted at /psychologist/direct-chat) ──────

const directChatPsychologistRouter = new Hono<{ Variables: AppVariables }>();

directChatPsychologistRouter.get("/conversations", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await directChatService.getConversations(
      c.var.user.userId,
      "psychologist",
      pagination,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

directChatPsychologistRouter.post("/conversations", async (c) => {
  try {
    const body = await c.req.json();
    const result = await directChatService.getOrCreateConversation(
      c.var.user.userId,
      "psychologist",
      body.studentId,
    );
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

directChatPsychologistRouter.get("/conversations/:id/messages", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await directChatService.getMessages(
      c.var.user.userId,
      c.req.param("id"),
      pagination,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

directChatPsychologistRouter.post("/conversations/:id/messages", async (c) => {
  try {
    const body = await c.req.json();
    const result = await directChatService.sendMessage(
      c.var.user.userId,
      "psychologist",
      c.req.param("id"),
      body,
    );
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

directChatPsychologistRouter.patch("/conversations/:id/read", async (c) => {
  try {
    await directChatService.markAsRead(c.var.user.userId, c.req.param("id"));
    return c.json({ ok: true });
  } catch (err) {
    return handleError(c, err);
  }
});

directChatPsychologistRouter.get("/unread-count", async (c) => {
  try {
    const result = await directChatService.getUnreadCount(c.var.user.userId);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

export { directChatStudentRouter, directChatPsychologistRouter };
