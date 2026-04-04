import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  inviteCode: z.string().min(1),
  language: z.enum(["ru", "kz"]).default("ru"),
  avatarId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  language: z.enum(["ru", "kz"]).optional(),
  avatarId: z.string().optional(),
});
