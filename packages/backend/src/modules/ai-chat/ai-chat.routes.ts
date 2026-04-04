import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { AppVariables } from "../../middleware/auth.js";
import { handleError } from "../../shared/errors.js";
import { parsePagination } from "../../shared/pagination.js";
import { aiChatService } from "./ai-chat.service.js";

const aiChatRouter = new Hono<{ Variables: AppVariables }>();

// POST /chat/sessions - create a new chat session
aiChatRouter.post("/sessions", async (c) => {
  try {
    const body = await c.req.json();
    const result = await aiChatService.createSession(c.var.user.userId, body);
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /chat/sessions/:id/message/stream - send a message with SSE streaming
aiChatRouter.post("/sessions/:id/message/stream", async (c) => {
  try {
    const body = await c.req.json();
    const { textStream, saveAssistantMessage } = await aiChatService.streamMessage(
      c.var.user.userId,
      c.req.param("id"),
      body,
    );

    return streamSSE(c, async (stream) => {
      let fullText = "";

      try {
        const reader = textStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += value;
          await stream.writeSSE({ data: JSON.stringify({ type: "token", content: value }) });
        }

        // Save the completed message
        await saveAssistantMessage(fullText);
        await stream.writeSSE({ data: JSON.stringify({ type: "done", content: fullText }) });
      } catch (error) {
        console.error("Stream error:", error);
        const fallback = "Извини, произошла ошибка. Попробуй ещё раз или позвони на телефон доверия: 150.";
        await saveAssistantMessage(fullText || fallback);
        await stream.writeSSE({ data: JSON.stringify({ type: "error", content: fallback }) });
      }
    });
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /chat/sessions/:id/message - send a message (non-streaming)
aiChatRouter.post("/sessions/:id/message", async (c) => {
  try {
    const body = await c.req.json();
    const result = await aiChatService.sendMessage(
      c.var.user.userId,
      c.req.param("id"),
      body,
    );
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /chat/sessions - list user's sessions
aiChatRouter.get("/sessions", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await aiChatService.getSessions(c.var.user.userId, pagination);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

// GET /chat/sessions/:id/messages - get messages for a session
aiChatRouter.get("/sessions/:id/messages", async (c) => {
  try {
    const pagination = parsePagination(c);
    const result = await aiChatService.getMessages(
      c.var.user.userId,
      c.req.param("id"),
      pagination,
    );
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
});

export { aiChatRouter };
