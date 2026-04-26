import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users, studentPsychologist, userStreaks } from "../../db/schema.js";
import type { StudentActivity } from "../../lib/inactivity-signal/inactivity-signal.js";

export const inactivitySignalRepository = {
  async findStudentsWithLastActivity(psychologistId: string): Promise<StudentActivity[]> {
    const rows = await db
      .select({
        studentId: users.id,
        studentName: users.name,
        grade: users.grade,
        classLetter: users.classLetter,
        lastActiveDate: userStreaks.lastActiveDate,
      })
      .from(studentPsychologist)
      .innerJoin(users, eq(studentPsychologist.studentId, users.id))
      .leftJoin(userStreaks, eq(userStreaks.userId, users.id))
      .where(eq(studentPsychologist.psychologistId, psychologistId));

    return rows.map((r) => ({
      studentId: r.studentId,
      studentName: r.studentName,
      grade: r.grade,
      classLetter: r.classLetter,
      lastActiveDate: r.lastActiveDate ?? null,
    }));
  },
};
