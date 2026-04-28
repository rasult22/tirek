import { and, eq, desc, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  moodEntries,
  diagnosticSessions,
  diagnosticTests,
  cbtEntries,
  conversations,
  directMessages,
  crisisSignals,
  studentPsychologist,
  testAssignments,
} from "../../db/schema.js";
import type { TimelineEvent } from "./timeline.js";

const MAX_PER_SOURCE = 200;

export const timelineRepository = {
  async isStudentLinked(studentId: string, psychologistId: string) {
    const [row] = await db
      .select({ id: studentPsychologist.studentId })
      .from(studentPsychologist)
      .where(
        and(
          eq(studentPsychologist.studentId, studentId),
          eq(studentPsychologist.psychologistId, psychologistId),
        ),
      )
      .limit(1);
    return row != null;
  },

  async findMoodEvents(studentId: string): Promise<TimelineEvent[]> {
    const rows = await db
      .select({
        id: moodEntries.id,
        mood: moodEntries.mood,
        note: moodEntries.note,
        createdAt: moodEntries.createdAt,
      })
      .from(moodEntries)
      .where(eq(moodEntries.userId, studentId))
      .orderBy(desc(moodEntries.createdAt))
      .limit(MAX_PER_SOURCE);

    return rows.map((r) => ({
      id: `mood:${r.id}`,
      type: "mood",
      occurredAt: r.createdAt,
      payload: { mood: r.mood, note: r.note ?? null },
    }));
  },

  async findTestEvents(studentId: string): Promise<TimelineEvent[]> {
    const rows = await db
      .select({
        id: diagnosticSessions.id,
        testSlug: diagnosticTests.slug,
        testName: diagnosticTests.nameRu,
        severity: diagnosticSessions.severity,
        completedAt: diagnosticSessions.completedAt,
      })
      .from(diagnosticSessions)
      .innerJoin(
        diagnosticTests,
        eq(diagnosticSessions.testId, diagnosticTests.id),
      )
      .where(
        and(
          eq(diagnosticSessions.userId, studentId),
          sql`${diagnosticSessions.completedAt} IS NOT NULL`,
        ),
      )
      .orderBy(desc(diagnosticSessions.completedAt))
      .limit(MAX_PER_SOURCE);

    return rows
      .filter((r): r is typeof r & { completedAt: Date } => r.completedAt !== null)
      .map((r) => ({
        id: `test:${r.id}`,
        type: "test",
        occurredAt: r.completedAt,
        payload: {
          sessionId: r.id,
          testSlug: r.testSlug,
          testName: r.testName,
          severity: r.severity ?? null,
        },
      }));
  },

  async findCbtEvents(studentId: string): Promise<TimelineEvent[]> {
    const rows = await db
      .select({
        id: cbtEntries.id,
        type: cbtEntries.type,
        data: cbtEntries.data,
        createdAt: cbtEntries.createdAt,
      })
      .from(cbtEntries)
      .where(eq(cbtEntries.userId, studentId))
      .orderBy(desc(cbtEntries.createdAt))
      .limit(MAX_PER_SOURCE);

    return rows.map((r) => ({
      id: `cbt:${r.id}`,
      type: "cbt",
      occurredAt: r.createdAt,
      payload: { cbtType: r.type, summary: cbtSummary(r.data) },
    }));
  },

  async findMessageEvents(
    studentId: string,
    psychologistId: string,
  ): Promise<TimelineEvent[]> {
    const rows = await db
      .select({
        id: directMessages.id,
        senderId: directMessages.senderId,
        content: directMessages.content,
        createdAt: directMessages.createdAt,
      })
      .from(directMessages)
      .innerJoin(
        conversations,
        eq(directMessages.conversationId, conversations.id),
      )
      .where(
        and(
          eq(conversations.studentId, studentId),
          eq(conversations.psychologistId, psychologistId),
        ),
      )
      .orderBy(desc(directMessages.createdAt))
      .limit(MAX_PER_SOURCE);

    return rows.map((r) => ({
      id: `message:${r.id}`,
      type: "message",
      occurredAt: r.createdAt,
      payload: {
        direction: r.senderId === studentId ? "from_student" : "from_psychologist",
        preview: previewOf(r.content),
      },
    }));
  },

  async findAssignmentCancelledEvents(
    studentId: string,
  ): Promise<TimelineEvent[]> {
    const rows = await db
      .select({
        id: testAssignments.id,
        testSlug: diagnosticTests.slug,
        testName: diagnosticTests.nameRu,
        cancelledAt: testAssignments.cancelledAt,
      })
      .from(testAssignments)
      .innerJoin(
        diagnosticTests,
        eq(testAssignments.testId, diagnosticTests.id),
      )
      .where(
        and(
          eq(testAssignments.targetType, "student"),
          eq(testAssignments.targetStudentId, studentId),
          eq(testAssignments.status, "cancelled"),
          sql`${testAssignments.cancelledAt} IS NOT NULL`,
        ),
      )
      .orderBy(desc(testAssignments.cancelledAt))
      .limit(MAX_PER_SOURCE);

    return rows
      .filter(
        (r): r is typeof r & { cancelledAt: Date } => r.cancelledAt !== null,
      )
      .map((r) => ({
        id: `assignment_cancelled:${r.id}`,
        type: "assignment_cancelled",
        occurredAt: r.cancelledAt,
        payload: {
          assignmentId: r.id,
          testSlug: r.testSlug,
          testName: r.testName,
        },
      }));
  },

  async findCrisisEvents(studentId: string): Promise<TimelineEvent[]> {
    const rows = await db
      .select({
        id: crisisSignals.id,
        type: crisisSignals.type,
        severity: crisisSignals.severity,
        summary: crisisSignals.summary,
        createdAt: crisisSignals.createdAt,
      })
      .from(crisisSignals)
      .where(eq(crisisSignals.studentId, studentId))
      .orderBy(desc(crisisSignals.createdAt))
      .limit(MAX_PER_SOURCE);

    return rows.map((r) => ({
      id: `crisis:${r.id}`,
      type: "crisis",
      occurredAt: r.createdAt,
      payload: {
        signalType: r.type,
        severity: r.severity,
        summary: r.summary,
      },
    }));
  },
};

function cbtSummary(data: unknown): string {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const candidate = d.situation ?? d.thought ?? d.title;
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate.slice(0, 200);
    }
  }
  return "";
}

function previewOf(content: string): string {
  return content.length > 200 ? content.slice(0, 200) : content;
}
