import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  diagnosticAiReports,
  diagnosticAnswers,
  diagnosticSessions,
  diagnosticTests,
  studentPsychologist,
  testAssignments,
  users,
} from "../../db/schema.js";
import { env } from "../../config/env.js";
import {
  REPORT_MODEL,
  createAiReportService,
  createReportLanguageResolver,
  type AiReportServiceDeps,
  type LlmCall,
  type PersistedAnswer,
  type PersistedReport,
  type PersistedSession,
  type PersistedStudent,
  type PersistedTest,
} from "./ai-report.service.js";

function getOpenAi(): OpenAI | null {
  if (!env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

const realCallLLM: LlmCall | null = (() => {
  const client = getOpenAi();
  if (!client) return null;
  return async ({ systemPrompt, userPayload }) => {
    const completion = await client.chat.completions.create({
      model: REPORT_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
    });
    return {
      content: completion.choices[0]?.message?.content ?? "{}",
      tokensUsed: completion.usage?.total_tokens ?? null,
    };
  };
})();

const dbResolveReportLanguage = createReportLanguageResolver({
  findAssignmentLanguageById: async (assignmentId) => {
    const [row] = await db
      .select({ language: users.language })
      .from(testAssignments)
      .innerJoin(users, eq(users.id, testAssignments.assignedBy))
      .where(eq(testAssignments.id, assignmentId))
      .limit(1);
    return row?.language ?? null;
  },
  findRecentTestAssignmentLanguage: async (studentId, testId) => {
    const [row] = await db
      .select({ language: users.language })
      .from(testAssignments)
      .innerJoin(users, eq(users.id, testAssignments.assignedBy))
      .where(
        and(
          eq(testAssignments.testId, testId),
          sql`(${testAssignments.targetStudentId} = ${studentId} OR ${testAssignments.targetType} = 'class')`,
        ),
      )
      .orderBy(desc(testAssignments.createdAt))
      .limit(1);
    return row?.language ?? null;
  },
  findFirstLinkedPsychologistLanguage: async (studentId) => {
    const [row] = await db
      .select({ language: users.language })
      .from(studentPsychologist)
      .innerJoin(users, eq(users.id, studentPsychologist.psychologistId))
      .where(eq(studentPsychologist.studentId, studentId))
      .orderBy(studentPsychologist.assignedAt)
      .limit(1);
    return row?.language ?? null;
  },
});

const realDeps: AiReportServiceDeps = {
  findReportBySessionId: async (sessionId) => {
    const [row] = await db
      .select()
      .from(diagnosticAiReports)
      .where(eq(diagnosticAiReports.sessionId, sessionId))
      .limit(1);
    return (row as PersistedReport | undefined) ?? null;
  },
  insertPendingReport: async ({ id, sessionId }) => {
    const [created] = await db
      .insert(diagnosticAiReports)
      .values({ id, sessionId, status: "pending" })
      .returning();
    return created as PersistedReport;
  },
  updateReport: async (sessionId, fields) => {
    const [updated] = await db
      .update(diagnosticAiReports)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(diagnosticAiReports.sessionId, sessionId))
      .returning();
    return (updated as PersistedReport | undefined) ?? null;
  },
  findSessionById: async (id) => {
    const [row] = await db
      .select({
        id: diagnosticSessions.id,
        userId: diagnosticSessions.userId,
        testId: diagnosticSessions.testId,
        assignmentId: diagnosticSessions.assignmentId,
        totalScore: diagnosticSessions.totalScore,
        maxScore: diagnosticSessions.maxScore,
        severity: diagnosticSessions.severity,
        completedAt: diagnosticSessions.completedAt,
        flaggedItems: diagnosticSessions.flaggedItems,
      })
      .from(diagnosticSessions)
      .where(eq(diagnosticSessions.id, id))
      .limit(1);
    return (row as PersistedSession | undefined) ?? null;
  },
  findTestById: async (id) => {
    const [row] = await db
      .select({
        id: diagnosticTests.id,
        slug: diagnosticTests.slug,
        nameRu: diagnosticTests.nameRu,
        description: diagnosticTests.description,
        questions: diagnosticTests.questions,
        scoringRules: diagnosticTests.scoringRules,
      })
      .from(diagnosticTests)
      .where(eq(diagnosticTests.id, id))
      .limit(1);
    return (row as PersistedTest | undefined) ?? null;
  },
  findAnswersBySession: async (sessionId) => {
    const rows = await db
      .select({
        sessionId: diagnosticAnswers.sessionId,
        questionIndex: diagnosticAnswers.questionIndex,
        answer: diagnosticAnswers.answer,
        score: diagnosticAnswers.score,
      })
      .from(diagnosticAnswers)
      .where(eq(diagnosticAnswers.sessionId, sessionId))
      .orderBy(diagnosticAnswers.questionIndex);
    return rows as PersistedAnswer[];
  },
  findStudentById: async (id) => {
    const [row] = await db
      .select({
        id: users.id,
        name: users.name,
        grade: users.grade,
        classLetter: users.classLetter,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return (row as PersistedStudent | undefined) ?? null;
  },
  findHistoryForUser: async (userId, testId, excludeSessionId) => {
    const rows = await db
      .select({
        id: diagnosticSessions.id,
        userId: diagnosticSessions.userId,
        testId: diagnosticSessions.testId,
        totalScore: diagnosticSessions.totalScore,
        maxScore: diagnosticSessions.maxScore,
        severity: diagnosticSessions.severity,
        completedAt: diagnosticSessions.completedAt,
      })
      .from(diagnosticSessions)
      .where(
        and(
          eq(diagnosticSessions.userId, userId),
          eq(diagnosticSessions.testId, testId),
          sql`${diagnosticSessions.completedAt} IS NOT NULL`,
          sql`${diagnosticSessions.id} <> ${excludeSessionId}`,
        ),
      )
      .orderBy(desc(diagnosticSessions.completedAt))
      .limit(5);
    return rows;
  },
  resolveReportLanguage: dbResolveReportLanguage,
  callLLM: realCallLLM,
  newId: () => uuidv4(),
  now: () => new Date(),
};

export const aiReportService = createAiReportService(realDeps);
