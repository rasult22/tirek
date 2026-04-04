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
import { users, moodEntries, diagnosticSessions, diagnosticTests, studentPsychologist } from "../../db/schema.js";
import { eq, desc, and, gte } from "drizzle-orm";
import { runMandatoryCrisisCheck } from "../../lib/crisis-keywords.js";

const VALID_MODES = ["talk", "problem", "exam", "discovery"] as const;

const FALLBACK_RESPONSE =
  "Извини, у меня возникла техническая проблема. Пожалуйста, попробуй ещё раз через несколько секунд. Если тебе нужна срочная помощь — позвони на телефон доверия: 150.";

async function buildStudentContext(userId: string, mode: string): Promise<string> {
  const [user] = await db
    .select({ name: users.name, grade: users.grade, classLetter: users.classLetter, language: users.language })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return "";

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
      totalScore: diagnosticSessions.totalScore,
      maxScore: diagnosticSessions.maxScore,
      severity: diagnosticSessions.severity,
      completedAt: diagnosticSessions.completedAt,
    })
    .from(diagnosticSessions)
    .innerJoin(diagnosticTests, eq(diagnosticSessions.testId, diagnosticTests.id))
    .where(and(eq(diagnosticSessions.userId, userId), gte(diagnosticSessions.startedAt, sevenDaysAgo)))
    .orderBy(desc(diagnosticSessions.completedAt))
    .limit(5);

  const className = user.grade && user.classLetter ? `${user.grade}${user.classLetter}` : user.grade ? `${user.grade} класс` : "не указан";

  let context = `\n═══ КОНТЕКСТ УЧЕНИКА (не озвучивай напрямую, используй для понимания) ═══\nИмя: ${user.name}\nКласс: ${className}\nЯзык: ${user.language === "kz" ? "казахский" : "русский"}\nРежим сессии: ${mode}`;

  if (recentMoods.length > 0) {
    const avgMood = Math.round((recentMoods.reduce((s, m) => s + m.mood, 0) / recentMoods.length) * 10) / 10;
    const stressEntries = recentMoods.filter((m) => m.stressLevel != null);
    const avgStress = stressEntries.length > 0
      ? Math.round((stressEntries.reduce((s, m) => s + (m.stressLevel ?? 0), 0) / stressEntries.length) * 10) / 10
      : null;

    context += `\n\nНастроение за 7 дней: среднее ${avgMood}/5 (${recentMoods.length} записей)`;
    if (avgStress !== null) context += `, стресс ${avgStress}/5`;
  }

  if (recentTests.length > 0) {
    const testLines = recentTests
      .filter((t) => t.completedAt)
      .map((t) => `  - ${t.testName}: ${t.totalScore}/${t.maxScore} (${t.severity ?? "не определено"})`)
      .join("\n");
    if (testLines) context += `\n\nНедавние тесты:\n${testLines}`;
  }

  return context;
}

export const aiChatService = {
  async createSession(userId: string, body: { mode: string }) {
    if (!VALID_MODES.includes(body.mode as (typeof VALID_MODES)[number])) {
      throw new ValidationError(
        `Mode must be one of: ${VALID_MODES.join(", ")}`,
      );
    }

    const session = await aiChatRepository.createSession({
      id: uuidv4(),
      userId,
      mode: body.mode,
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

    // Mandatory crisis detection — runs on EVERY incoming message BEFORE agent
    try {
      await runMandatoryCrisisCheck(body.content, userId, sessionId, userMessage.id);
    } catch (err) {
      console.error("Mandatory crisis check error (non-blocking):", err);
    }

    // Build student context for agent awareness
    const studentContext = await buildStudentContext(userId, session.mode);

    const agent = mastra.getAgent("supportAgent");

    // Stream response via Mastra support agent
    const streamResult = await agent.stream(
      [
        ...(studentContext ? [{ role: "system" as const, content: studentContext }] : []),
        { role: "user" as const, content: body.content },
      ],
      {
        memory: { thread: sessionId, resource: userId },
      },
    );

    return {
      textStream: streamResult.textStream,
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

    // Mandatory crisis detection — runs on EVERY incoming message BEFORE agent
    try {
      await runMandatoryCrisisCheck(body.content, userId, sessionId, userMsg.id);
    } catch (err) {
      console.error("Mandatory crisis check error (non-blocking):", err);
    }

    let assistantContent: string;
    try {
      const studentContext = await buildStudentContext(userId, session.mode);
      const agent = mastra.getAgent("supportAgent");
      const response = await agent.generate(
        [
          ...(studentContext ? [{ role: "system" as const, content: studentContext }] : []),
          { role: "user" as const, content: body.content },
        ],
        {
          memory: { thread: sessionId, resource: userId },
        },
      );
      assistantContent = response.text;
    } catch (error) {
      console.error("Mastra agent error:", error);
      assistantContent = FALLBACK_RESPONSE;
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

  async getFlaggedMessages(psychologistId: string, pagination: PaginationParams) {
    // Get student IDs linked to this psychologist
    const links = await db
      .select({ studentId: studentPsychologist.studentId })
      .from(studentPsychologist)
      .where(eq(studentPsychologist.psychologistId, psychologistId));

    const studentIds = links.map((l) => l.studentId);

    const { rows, total } = await aiChatRepository.findFlaggedMessages(studentIds, pagination);

    // Truncate content for privacy
    const data = rows.map((r) => ({
      messageId: r.messageId,
      content: r.content.length > 200 ? r.content.slice(0, 200) + "..." : r.content,
      createdAt: r.createdAt,
      sessionId: r.sessionId,
      studentName: r.studentName,
      studentGrade: r.studentGrade,
      studentClass: r.studentClass,
    }));

    return paginated(data, total, pagination);
  },
};
