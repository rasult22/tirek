import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { eq, and, isNull } from "drizzle-orm";
import { signToken } from "../../lib/jwt.js";
import { db } from "../../db/index.js";
import { inviteCodes, studentPsychologist } from "../../db/schema.js";
import { authRepository } from "./auth.repository.js";
import { createAuthService } from "./auth.service.js";
import type {
  PersistedInviteCodeForAuth,
  PersistedUser,
} from "./auth.service.js";

export const authService = createAuthService({
  findUserByEmail: (email) =>
    authRepository.findByEmail(email) as Promise<PersistedUser | null>,
  findUserById: (id) =>
    authRepository.findById(id) as Promise<PersistedUser | null>,
  createUser: (data) =>
    authRepository.create(data) as Promise<PersistedUser>,
  updateUserProfile: (id, data) =>
    authRepository.updateProfile(id, data) as Promise<PersistedUser | null>,
  findActiveInviteByCode: async (code) => {
    const [row] = await db
      .select()
      .from(inviteCodes)
      .where(and(eq(inviteCodes.code, code), isNull(inviteCodes.usedBy)))
      .limit(1);
    return (row ?? null) as PersistedInviteCodeForAuth | null;
  },
  markInviteCodeUsed: async (id, userId) => {
    await db
      .update(inviteCodes)
      .set({ usedBy: userId, usedAt: new Date() })
      .where(eq(inviteCodes.id, id));
  },
  linkStudentToPsychologist: async (studentId, psychologistId) => {
    await db
      .insert(studentPsychologist)
      .values({ studentId, psychologistId });
  },
  hashPassword: (pw) => bcrypt.hash(pw, 10),
  verifyPassword: (pw, hash) => bcrypt.compare(pw, hash),
  signToken,
  now: () => new Date(),
  newId: () => uuidv4(),
});
