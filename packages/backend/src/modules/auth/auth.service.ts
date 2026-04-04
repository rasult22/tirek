import { eq, and, isNull, gt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { signToken } from "../../lib/jwt.js";
import { db } from "../../db/index.js";
import { inviteCodes, studentPsychologist } from "../../db/schema.js";
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
} from "../../shared/errors.js";
import { authRepository } from "./auth.repository.js";

export const authService = {
  async register(body: {
    email?: string;
    password?: string;
    name?: string;
    inviteCode?: string;
  }) {
    const { email, password, name, inviteCode } = body;

    if (!inviteCode) {
      throw new ValidationError("Invite code is required");
    }
    if (!email || !password || !name) {
      throw new ValidationError("Email, password, and name are required");
    }

    // Validate invite code
    const [code] = await db
      .select()
      .from(inviteCodes)
      .where(
        and(
          eq(inviteCodes.code, inviteCode),
          isNull(inviteCodes.usedBy),
        ),
      )
      .limit(1);

    if (!code) {
      throw new ValidationError("Invalid or already used invite code");
    }

    if (code.expiresAt && code.expiresAt < new Date()) {
      throw new ValidationError("Invite code has expired");
    }

    // Check for existing user
    const existing = await authRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    const user = await authRepository.create({
      id: userId,
      email,
      passwordHash,
      name,
      role: "student",
      grade: code.grade ?? null,
      classLetter: code.classLetter ?? null,
      schoolId: code.schoolId ?? null,
    });

    // Mark invite code as used
    await db
      .update(inviteCodes)
      .set({ usedBy: userId, usedAt: new Date() })
      .where(eq(inviteCodes.id, code.id));

    // Create student-psychologist link
    await db.insert(studentPsychologist).values({
      studentId: userId,
      psychologistId: code.psychologistId,
    });

    // Generate token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
        avatarId: user.avatarId,
        grade: user.grade,
        classLetter: user.classLetter,
      },
    };
  },

  async login(body: { email?: string; password?: string }) {
    const { email, password } = body;

    if (!email || !password) {
      throw new ValidationError("Email and password are required");
    }

    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
        avatarId: user.avatarId,
        grade: user.grade,
        classLetter: user.classLetter,
      },
    };
  },

  async me(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      language: user.language,
      avatarId: user.avatarId,
      grade: user.grade,
      classLetter: user.classLetter,
      createdAt: user.createdAt,
    };
  },

  async updateProfile(
    userId: string,
    body: { name?: string; language?: string; avatarId?: string | null },
  ) {
    const user = await authRepository.updateProfile(userId, body);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      language: user.language,
      avatarId: user.avatarId,
      grade: user.grade,
      classLetter: user.classLetter,
    };
  },
};
