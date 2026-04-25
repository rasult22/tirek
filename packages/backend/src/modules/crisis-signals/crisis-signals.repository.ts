import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  crisisSignals,
  notifications,
  studentPsychologist,
} from "../../db/schema.js";
import type {
  PersistedCrisisSignal,
  PersistedNotification,
} from "./crisis-signal-router.js";

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
};
