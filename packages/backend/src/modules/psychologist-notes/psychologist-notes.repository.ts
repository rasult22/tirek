import { eq, and, desc, sql, count as dbCount } from "drizzle-orm";
import { db } from "../../db/index.js";
import { psychologistNotes } from "../../db/schema.js";
import type { PaginationParams } from "../../shared/pagination.js";

export const notesRepository = {
  async create(data: {
    id: string;
    psychologistId: string;
    studentId: string;
    content: string;
  }) {
    const [note] = await db
      .insert(psychologistNotes)
      .values(data)
      .returning();
    return note;
  },

  async findByStudent(
    psychologistId: string,
    studentId: string,
    pagination: PaginationParams,
  ) {
    return db
      .select()
      .from(psychologistNotes)
      .where(
        and(
          eq(psychologistNotes.psychologistId, psychologistId),
          eq(psychologistNotes.studentId, studentId),
        ),
      )
      .orderBy(desc(psychologistNotes.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countByStudent(psychologistId: string, studentId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(psychologistNotes)
      .where(
        and(
          eq(psychologistNotes.psychologistId, psychologistId),
          eq(psychologistNotes.studentId, studentId),
        ),
      );
    return Number(row?.value ?? 0);
  },

  async findById(id: string) {
    const [note] = await db
      .select()
      .from(psychologistNotes)
      .where(eq(psychologistNotes.id, id))
      .limit(1);
    return note ?? null;
  },

  async update(id: string, content: string) {
    const [note] = await db
      .update(psychologistNotes)
      .set({
        content,
        updatedAt: sql`NOW()`,
      })
      .where(eq(psychologistNotes.id, id))
      .returning();
    return note;
  },
};
