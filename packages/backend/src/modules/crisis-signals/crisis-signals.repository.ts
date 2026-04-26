import { and, desc, eq, isNull, sql, count as dbCount } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  crisisSignals,
  notifications,
  studentPsychologist,
  users,
} from "../../db/schema.js";
import type { PaginationParams } from "../../shared/pagination.js";
import type {
  CrisisSignalRow,
  CrisisSignalSeverity,
  CrisisSignalSource,
  CrisisSignalType,
  PersistedCrisisSignal,
  PersistedNotification,
  ResolveInput,
} from "./index.js";

const signalSelect = {
  id: crisisSignals.id,
  studentId: crisisSignals.studentId,
  studentName: users.name,
  studentGrade: users.grade,
  studentClassLetter: users.classLetter,
  type: crisisSignals.type,
  severity: crisisSignals.severity,
  source: crisisSignals.source,
  summary: crisisSignals.summary,
  metadata: crisisSignals.metadata,
  createdAt: crisisSignals.createdAt,
  resolvedAt: crisisSignals.resolvedAt,
  resolvedBy: crisisSignals.resolvedBy,
  resolutionNotes: crisisSignals.resolutionNotes,
  contactedStudent: crisisSignals.contactedStudent,
  contactedParent: crisisSignals.contactedParent,
  documented: crisisSignals.documented,
};

type RawRow = {
  id: string;
  studentId: string;
  studentName: string;
  studentGrade: number | null;
  studentClassLetter: string | null;
  type: string;
  severity: string;
  source: string;
  summary: string;
  metadata: unknown;
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  contactedStudent: boolean;
  contactedParent: boolean;
  documented: boolean;
};

function toRow(row: RawRow, linkedPsychologistId: string): CrisisSignalRow {
  return {
    id: row.id,
    studentId: row.studentId,
    studentName: row.studentName,
    studentGrade: row.studentGrade,
    studentClassLetter: row.studentClassLetter,
    type: row.type as CrisisSignalType,
    severity: row.severity as CrisisSignalSeverity,
    source: row.source as CrisisSignalSource,
    summary: row.summary,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
    resolvedBy: row.resolvedBy,
    resolutionNotes: row.resolutionNotes,
    contactedStudent: row.contactedStudent,
    contactedParent: row.contactedParent,
    documented: row.documented,
    linkedPsychologistIds: [linkedPsychologistId],
  };
}

export const crisisSignalsRepository = {
  async insertSignal(signal: PersistedCrisisSignal): Promise<string> {
    const [row] = await db
      .insert(crisisSignals)
      .values({
        id: signal.id,
        studentId: signal.studentId,
        type: signal.type,
        severity: signal.severity,
        source: signal.source,
        summary: signal.summary,
        metadata: signal.metadata,
        createdAt: signal.createdAt,
      })
      .returning({ id: crisisSignals.id });
    return row.id;
  },

  async findPsychologistIdsForStudent(studentId: string): Promise<string[]> {
    const rows = await db
      .select({ psychologistId: studentPsychologist.psychologistId })
      .from(studentPsychologist)
      .where(eq(studentPsychologist.studentId, studentId));
    return rows.map((r) => r.psychologistId);
  },

  async insertNotification(notification: PersistedNotification): Promise<string> {
    const [row] = await db
      .insert(notifications)
      .values({
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        metadata: notification.metadata,
      })
      .returning({ id: notifications.id });
    return row.id;
  },

  async findActiveByPsychologistAndType(
    psychologistId: string,
    type: CrisisSignalType,
  ): Promise<CrisisSignalRow[]> {
    const rows = await db
      .select(signalSelect)
      .from(crisisSignals)
      .innerJoin(
        studentPsychologist,
        eq(crisisSignals.studentId, studentPsychologist.studentId),
      )
      .innerJoin(users, eq(crisisSignals.studentId, users.id))
      .where(
        and(
          eq(studentPsychologist.psychologistId, psychologistId),
          eq(crisisSignals.type, type),
          isNull(crisisSignals.resolvedAt),
        ),
      );
    return rows.map((r) => toRow(r, psychologistId));
  },

  async findHistoryByPsychologist(
    psychologistId: string,
    pagination: PaginationParams = { limit: 1000, offset: 0 },
  ): Promise<{ items: CrisisSignalRow[]; total: number }> {
    const [items, totalRow] = await Promise.all([
      db
        .select(signalSelect)
        .from(crisisSignals)
        .innerJoin(
          studentPsychologist,
          eq(crisisSignals.studentId, studentPsychologist.studentId),
        )
        .innerJoin(users, eq(crisisSignals.studentId, users.id))
        .where(
          and(
            eq(studentPsychologist.psychologistId, psychologistId),
            sql`${crisisSignals.resolvedAt} IS NOT NULL`,
          ),
        )
        .orderBy(desc(crisisSignals.resolvedAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db
        .select({ value: dbCount() })
        .from(crisisSignals)
        .innerJoin(
          studentPsychologist,
          eq(crisisSignals.studentId, studentPsychologist.studentId),
        )
        .where(
          and(
            eq(studentPsychologist.psychologistId, psychologistId),
            sql`${crisisSignals.resolvedAt} IS NOT NULL`,
          ),
        ),
    ]);
    return {
      items: items.map((r) => toRow(r, psychologistId)),
      total: Number(totalRow[0]?.value ?? 0),
    };
  },

  async findByIdForPsychologist(
    signalId: string,
    psychologistId: string,
  ): Promise<CrisisSignalRow | null> {
    const [row] = await db
      .select(signalSelect)
      .from(crisisSignals)
      .innerJoin(
        studentPsychologist,
        eq(crisisSignals.studentId, studentPsychologist.studentId),
      )
      .innerJoin(users, eq(crisisSignals.studentId, users.id))
      .where(
        and(
          eq(crisisSignals.id, signalId),
          eq(studentPsychologist.psychologistId, psychologistId),
        ),
      )
      .limit(1);
    if (!row) return null;
    return toRow(row, psychologistId);
  },

  async resolveSignal(
    signalId: string,
    input: ResolveInput,
  ): Promise<CrisisSignalRow> {
    const [updated] = await db
      .update(crisisSignals)
      .set({
        resolvedAt: input.resolvedAt,
        resolvedBy: input.resolvedBy,
        resolutionNotes: input.notes,
        contactedStudent: input.contactedStudent,
        contactedParent: input.contactedParent,
        documented: input.documented,
      })
      .where(eq(crisisSignals.id, signalId))
      .returning();
    const [withStudent] = await db
      .select(signalSelect)
      .from(crisisSignals)
      .innerJoin(users, eq(crisisSignals.studentId, users.id))
      .where(eq(crisisSignals.id, updated.id))
      .limit(1);
    return toRow(withStudent, input.resolvedBy);
  },

  async countActiveByPsychologistAndType(
    psychologistId: string,
    type: CrisisSignalType,
  ): Promise<number> {
    const [row] = await db
      .select({ value: dbCount() })
      .from(crisisSignals)
      .innerJoin(
        studentPsychologist,
        eq(crisisSignals.studentId, studentPsychologist.studentId),
      )
      .where(
        and(
          eq(studentPsychologist.psychologistId, psychologistId),
          eq(crisisSignals.type, type),
          isNull(crisisSignals.resolvedAt),
        ),
      );
    return Number(row?.value ?? 0);
  },
};
