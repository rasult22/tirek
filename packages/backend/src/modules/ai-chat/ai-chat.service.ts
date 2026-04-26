import { v4 as uuidv4 } from "uuid";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../../shared/errors.js";
import type { PaginationParams } from "../../shared/pagination.js";
import { paginated } from "../../shared/pagination.js";
import { aiChatRepository } from "./ai-chat.repository.js";
import { mastra } from "../../core/ai/mastra.js";
import { studentContext } from "./student-context.index.js";
import { productiveActionService } from "../productive-action/index.js";

const FALLBACK_RESPONSES: Record<string, string> = {
  ru: "Извини, у меня возникла техническая проблема. Пожалуйста, попробуй ещё раз через несколько секунд. Если тебе нужна срочная помощь — позвони на телефон доверия: 150.",
  kz: "Кешір, техникалық ақау пайда болды. Бірнеше секундтан кейін қайталап көрші. Шұғыл көмек қажет болса — сенім телефонына хабарлас: 150.",
};

export const aiChatService = {
  async createSession(userId: string) {
    const session = await aiChatRepository.createSession({
      id: uuidv4(),
      userId,
    });

    return session;
  },

  async streamMessage(
    userId: string,
    sessionId: string,
    body: { content: string },
  ) {
    const session = await aiChatRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError("Chat session not found");
    }
    if (session.userId !== userId) {
      throw new ForbiddenError("Access denied to this chat session");
    }

    if (!body.content || body.content.trim().length === 0) {
      throw new ValidationError("Message content cannot be empty");
    }

    // Save user message
    const userMessage = await aiChatRepository.createMessage({
      sessionId,
      role: "user",
      content: body.content,
    });

    // AI-Friend message — Productive Action; идемпотентен по Almaty Day внутри координатора.
    productiveActionService
      .recordProductiveAction(userId, "ai_chat")
      .catch(() => {});

    // Build student context for agent awareness (cached per session).
    const snapshot = await studentContext.getOrBuild(userId, sessionId);

    const toolContext = `\n═══ СИСТЕМНЫЕ ДАННЫЕ ДЛЯ ИНСТРУМЕНТОВ (не озвучивай) ═══\nuserId: ${userId}\nsessionId: ${sessionId}\nИспользуй эти данные при вызове crisis_signal.`;

    const agent = mastra.getAgent("supportAgent");

    // Stream response via Mastra support agent — use fullStream to capture tool calls
    const streamResult = await agent.stream(
      [
        { role: "system" as const, content: snapshot.prompt + toolContext },
        { role: "user" as const, content: body.content },
      ],
      {
        memory: { thread: sessionId, resource: userId },
      },
    );

    return {
      fullStream: streamResult.fullStream,
      async saveAssistantMessage(fullText: string) {
        await aiChatRepository.createMessage({
          sessionId,
          role: "assistant",
          content: fullText,
        });
        await aiChatRepository.updateSessionLastMessage(sessionId);
      },
    };
  },

  /** Non-streaming fallback for backward compat */
  async sendMessage(
    userId: string,
    sessionId: string,
    body: { content: string },
  ) {
    const session = await aiChatRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError("Chat session not found");
    }
    if (session.userId !== userId) {
      throw new ForbiddenError("Access denied to this chat session");
    }

    if (!body.content || body.content.trim().length === 0) {
      throw new ValidationError("Message content cannot be empty");
    }

    const userMsg = await aiChatRepository.createMessage({
      sessionId,
      role: "user",
      content: body.content,
    });

    productiveActionService
      .recordProductiveAction(userId, "ai_chat")
      .catch(() => {});

    let assistantContent: string;
    let snapshotLanguage = "ru";
    try {
      const snapshot = await studentContext.getOrBuild(userId, sessionId);
      snapshotLanguage = snapshot.language;
      const toolContext = `\n═══ СИСТЕМНЫЕ ДАННЫЕ ДЛЯ ИНСТРУМЕНТОВ (не озвучивай) ═══\nuserId: ${userId}\nsessionId: ${sessionId}\nИспользуй эти данные при вызове crisis_signal.`;
      const agent = mastra.getAgent("supportAgent");
      const response = await agent.generate(
        [
          { role: "system" as const, content: snapshot.prompt + toolContext },
          { role: "user" as const, content: body.content },
        ],
        {
          memory: { thread: sessionId, resource: userId },
        },
      );
      assistantContent = response.text;
    } catch (error) {
      console.error("Mastra agent error:", error);
      assistantContent =
        FALLBACK_RESPONSES[snapshotLanguage] ?? FALLBACK_RESPONSES.ru;
    }

    const assistantMessage = await aiChatRepository.createMessage({
      sessionId,
      role: "assistant",
      content: assistantContent,
    });

    await aiChatRepository.updateSessionLastMessage(sessionId);

    return assistantMessage;
  },

  async getSessions(userId: string, pagination: PaginationParams) {
    const [sessions, total] = await Promise.all([
      aiChatRepository.findSessionsByUser(userId, pagination),
      aiChatRepository.countSessionsByUser(userId),
    ]);
    return paginated(sessions, total, pagination);
  },

  async getMessages(userId: string, sessionId: string, pagination: PaginationParams) {
    const session = await aiChatRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError("Chat session not found");
    }
    if (session.userId !== userId) {
      throw new ForbiddenError("Access denied to this chat session");
    }

    const [messages, total] = await Promise.all([
      aiChatRepository.findMessagesBySession(sessionId, pagination),
      aiChatRepository.countMessagesBySession(sessionId),
    ]);
    return paginated(messages, total, pagination);
  },
};
