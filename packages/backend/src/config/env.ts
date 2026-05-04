import { z } from "zod";

const envSchema = z.object({
  // Database — either a full URL or individual fields
  DATABASE_URL: z.string().url().optional(),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default("tirek_user"),
  DB_PASSWORD: z.string().default("tirek_password"),
  DB_NAME: z.string().default("tirek_db"),

  // Auth
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // AI
  OPENAI_API_KEY: z.string().optional(),

  // Email (Brevo HTTP API — Railway блокирует исходящий SMTP).
  // Опциональны: без них emailSender не инициализируется и reset-флоу должен это учитывать.
  BREVO_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_FROM_NAME: z.string().optional(),

  // Ports
  API_PORT: z.coerce.number().default(3000),
  PORT: z.coerce.number().default(4111),

  // Runtime
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export const env = envSchema.parse(process.env);

export const databaseUrl =
  env.DATABASE_URL ??
  `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
