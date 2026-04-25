import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
} from "../../shared/errors.js";

export type PersistedUser = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  language: string;
  avatarId: string | null;
  grade: number | null;
  classLetter: string | null;
  schoolId: string | null;
  createdAt: Date;
};

export type CreateUserInput = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  grade?: number | null;
  classLetter?: string | null;
  schoolId?: string | null;
};

export type UpdateUserProfileInput = {
  name?: string;
  language?: string;
  avatarId?: string | null;
};

export type PersistedInviteCodeForAuth = {
  id: string;
  code: string;
  psychologistId: string;
  studentRealName: string;
  grade: number | null;
  classLetter: string | null;
  usedBy: string | null;
  usedAt: Date | null;
  expiresAt: Date | null;
};

export type AuthServiceDeps = {
  findUserByEmail: (email: string) => Promise<PersistedUser | null>;
  findUserById: (id: string) => Promise<PersistedUser | null>;
  createUser: (data: CreateUserInput) => Promise<PersistedUser>;
  updateUserProfile: (
    id: string,
    data: UpdateUserProfileInput,
  ) => Promise<PersistedUser | null>;
  findActiveInviteByCode: (
    code: string,
  ) => Promise<PersistedInviteCodeForAuth | null>;
  markInviteCodeUsed: (id: string, userId: string) => Promise<void>;
  linkStudentToPsychologist: (
    studentId: string,
    psychologistId: string,
  ) => Promise<void>;
  hashPassword: (password: string) => Promise<string>;
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
  signToken: (payload: { userId: string; email: string; role: string }) => string;
  now: () => Date;
  newId: () => string;
};

function publicUser(user: PersistedUser) {
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
}

export function createAuthService(deps: AuthServiceDeps) {
  return {
    async register(body: {
      email?: string;
      password?: string;
      inviteCode?: string;
    }) {
      const { email, password, inviteCode } = body;

      if (!inviteCode) {
        throw new ValidationError("Invite code is required");
      }
      if (!email || !password) {
        throw new ValidationError("Email and password are required");
      }

      const code = await deps.findActiveInviteByCode(inviteCode);
      if (!code) {
        throw new ValidationError("Invalid or already used invite code");
      }

      if (code.expiresAt && code.expiresAt < deps.now()) {
        throw new ValidationError("Invite code has expired");
      }

      const existing = await deps.findUserByEmail(email);
      if (existing) {
        throw new ConflictError("Email already registered");
      }

      const passwordHash = await deps.hashPassword(password);

      const userId = deps.newId();
      const user = await deps.createUser({
        id: userId,
        email,
        passwordHash,
        name: code.studentRealName,
        role: "student",
        grade: code.grade,
        classLetter: code.classLetter,
        schoolId: null,
      });

      await deps.markInviteCodeUsed(code.id, userId);
      await deps.linkStudentToPsychologist(userId, code.psychologistId);

      const token = deps.signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return { token, user: publicUser(user) };
    },

    async registerPsychologist(body: {
      email?: string;
      password?: string;
      name?: string;
      schoolId?: string;
    }) {
      const { email, password, name, schoolId } = body;

      if (!email || !password || !name) {
        throw new ValidationError("Email, password, and name are required");
      }

      const existing = await deps.findUserByEmail(email);
      if (existing) {
        throw new ConflictError("Email already registered");
      }

      const passwordHash = await deps.hashPassword(password);

      const userId = deps.newId();
      const user = await deps.createUser({
        id: userId,
        email,
        passwordHash,
        name,
        role: "psychologist",
        schoolId: schoolId || null,
      });

      const token = deps.signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return { token, user: publicUser(user) };
    },

    async login(body: { email?: string; password?: string }) {
      const { email, password } = body;

      if (!email || !password) {
        throw new ValidationError("Email and password are required");
      }

      const user = await deps.findUserByEmail(email);
      if (!user) {
        throw new UnauthorizedError("Invalid email or password");
      }

      const valid = await deps.verifyPassword(password, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedError("Invalid email or password");
      }

      const token = deps.signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return { token, user: publicUser(user) };
    },

    async me(userId: string) {
      const user = await deps.findUserById(userId);
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

    async updateProfile(userId: string, body: UpdateUserProfileInput) {
      const user = await deps.updateUserProfile(userId, body);
      if (!user) {
        throw new NotFoundError("User not found");
      }
      return publicUser(user);
    },
  };
}
