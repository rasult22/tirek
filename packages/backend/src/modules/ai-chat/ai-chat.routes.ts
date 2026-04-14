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
    const body = await c.req.json().catch(() => ({}));
    const result = await aiChatService.createSession(c.var.user.userId, body);
    return c.json(result, 201);
  } catch (err) {
    return handleError(c, err);
  }
});

// POST /chat/sessions/:id/stream - send a message with SSE streaming
aiChatRouter.post("/sessions/:id/stream", async (c) => {
  try {
    const body = await c.req.json();
    const { fullStream, saveAssistantMessage } = await aiChatService.streamMessage(
      c.var.user.userId,
      c.req.param("id"),
      body,
    );

    return streamSSE(c, async (stream) => {
      let fullText = "";

      try {
        const reader = fullStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = value as any;

          if (chunk.type === "text-delta" && chunk.payload?.text) {
            fullText += chunk.payload.text;
            await stream.writeSSE({ data: JSON.stringify({ type: "token", content: chunk.payload.text }) });
          } else if (chunk.type === "tool-call") {
            console.log(JSON.stringify({ event: "tool-call", tool: chunk.payload?.toolName, args: chunk.payload?.args }));
          } else if (chunk.type === "tool-result" && chunk.payload?.toolName) {
            console.log(JSON.stringify({ event: "tool-result", tool: chunk.payload.toolName, result: chunk.payload.result }));
            await stream.writeSSE({
              data: JSON.stringify({
                type: "tool_call",
                toolName: chunk.payload.toolName,
                result: chunk.payload.result,
              }),
            });
          }
        }

        // Save the completed message
        await saveAssistantMessage(fullText);
        await stream.writeSSE({ data: JSON.stringify({ type: "done", content: fullText }) });
      } catch (error) {
        console.error("Stream error:", error);
        const fallback = "Извини, произошла ошибка. Попробуй ещё раз или позвони на телефон доверия: 150. / Кешір, қате пайда болды. Қайталап көрші немесе сенім телефонына хабарлас: 150.";
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
