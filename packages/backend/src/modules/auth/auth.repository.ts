import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";

export const authRepository = {
  async findByEmail(email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user ?? null;
  },

  async findById(id: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user ?? null;
  },

  async create(data: {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: string;
    grade?: number | null;
    classLetter?: string | null;
    schoolId?: string | null;
  }) {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      language?: string;
      avatarId?: string | null;
      schoolId?: string | null;
    },
  ) {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user ?? null;
  },

  // Идемпотентно: SET выполняется только когда onboarded_at IS NULL,
  // чтобы повторный вызов не двигал дату прохождения.
  async markOnboardedNow(userId: string, when: Date) {
    await db
      .update(users)
      .set({ onboardedAt: when, updatedAt: when })
      .where(and(eq(users.id, userId), isNull(users.onboardedAt)));
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return user ?? null;
  },
};
