import { eq, and, isNull, desc, count as dbCount } from "drizzle-orm";
import { db } from "../../db/index.js";
import { inviteCodes } from "../../db/schema.js";
import type { PaginationParams } from "../../shared/pagination.js";

export const inviteCodesRepository = {
  async create(data: {
    id: string;
    code: string;
    psychologistId: string;
    grade?: number | null;
    classLetter?: string | null;
    schoolId?: string | null;
    expiresAt: Date;
  }) {
    const [row] = await db.insert(inviteCodes).values(data).returning();
    return row;
  },

  async findByPsychologist(psychologistId: string, pagination: PaginationParams) {
    return db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.psychologistId, psychologistId))
      .orderBy(desc(inviteCodes.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
  },

  async countByPsychologist(psychologistId: string) {
    const [row] = await db
      .select({ value: dbCount() })
      .from(inviteCodes)
      .where(eq(inviteCodes.psychologistId, psychologistId));
    return Number(row?.value ?? 0);
  },

  async findById(id: string) {
    const [row] = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.id, id))
      .limit(1);
    return row ?? null;
  },

  async deleteById(id: string) {
    const [deleted] = await db
      .delete(inviteCodes)
      .where(and(eq(inviteCodes.id, id), isNull(inviteCodes.usedBy)))
      .returning();
    return deleted ?? null;
  },

  async findByCode(code: string) {
    const [row] = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, code))
      .limit(1);
    return row ?? null;
  },

  async markUsed(id: string, userId: string) {
    const [row] = await db
      .update(inviteCodes)
      .set({ usedBy: userId, usedAt: new Date() })
      .where(eq(inviteCodes.id, id))
      .returning();
    return row ?? null;
  },
};
