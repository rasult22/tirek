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
import { db } from "../../db/index.js";
import { users, moodEntries, diagnosticSessions, diagnosticTests } from "../../db/schema.js";
import { eq, desc, and, gte } from "drizzle-orm";
import { buildStudentContextPure } from "./build-student-context.js";
import { streaksService } from "../streaks/streaks.service.js";

const FALLBACK_RESPONSES: Record<string, string> = {
  ru: "Извини, у меня возникла техническая проблема. Пожалуйста, попробуй ещё раз через несколько секунд. Если тебе нужна срочная помощь — позвони на телефон доверия: 150.",
  kz: "Кешір, техникалық ақау пайда болды. Бірнеше секундтан кейін қайталап көрші. Шұғыл көмек қажет болса — сенім телефонына хабарлас: 150.",
};

async function buildStudentContext(userId: string): Promise<{ context: string; language: string }> {
  const [user] = await db
    .select({ name: users.name, grade: users.grade, classLetter: users.classLetter, language: users.language })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { context: "", language: "ru" };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentMoods = await db
    .select({ mood: moodEntries.mood, stressLevel: moodEntries.stressLevel, sleepQuality: moodEntries.sleepQuality, createdAt: moodEntries.createdAt })
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.createdAt, sevenDaysAgo)))
    .orderBy(desc(moodEntries.createdAt))
    .limit(7);

  const recentTests = await db
    .select({
      testName: diagnosticTests.nameRu,
      completedAt: diagnosticSessions.completedAt,
    })
    .from(diagnosticSessions)
    .innerJoin(diagnosticTests, eq(diagnosticSessions.testId, diagnosticTests.id))
    .where(and(eq(diagnosticSessions.userId, userId), gte(diagnosticSessions.startedAt, sevenDaysAgo)))
    .orderBy(desc(diagnosticSessions.completedAt))
    .limit(5);

  return buildStudentContextPure({
    user,
    recentMoods,
    recentTests,
  });
}

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

    // AI-Friend message — Productive Action; идемпотентен по Almaty Day внутри streaksService.
    streaksService.recordActivity(userId).catch(() => {});

    // Build student context for agent awareness
    const { context: studentContext } = await buildStudentContext(userId);

    const toolContext = `\n═══ СИСТЕМНЫЕ ДАННЫЕ ДЛЯ ИНСТРУМЕНТОВ (не озвучивай) ═══\nuserId: ${userId}\nsessionId: ${sessionId}\nИспользуй эти данные при вызове crisis_signal.`;

    const agent = mastra.getAgent("supportAgent");

    // Stream response via Mastra support agent — use fullStream to capture tool calls
    const streamResult = await agent.stream(
      [
        { role: "system" as const, content: (studentContext || "") + toolContext },
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

    streaksService.recordActivity(userId).catch(() => {});

    let assistantContent: string;
    try {
      const { context: studentContext, language } = await buildStudentContext(userId);
      const toolContext = `\n═══ СИСТЕМНЫЕ ДАННЫЕ ДЛЯ ИНСТРУМЕНТОВ (не озвучивай) ═══\nuserId: ${userId}\nsessionId: ${sessionId}\nИспользуй эти данные при вызове crisis_signal.`;
      const agent = mastra.getAgent("supportAgent");
      const response = await agent.generate(
        [
          { role: "system" as const, content: (studentContext || "") + toolContext },
          { role: "user" as const, content: body.content },
        ],
        {
          memory: { thread: sessionId, resource: userId },
        },
      );
      assistantContent = response.text;
    } catch (error) {
      console.error("Mastra agent error:", error);
      const [userData] = await db.select({ language: users.language }).from(users).where(eq(users.id, userId)).limit(1);
      assistantContent = FALLBACK_RESPONSES[userData?.language ?? "ru"] ?? FALLBACK_RESPONSES.ru;
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
