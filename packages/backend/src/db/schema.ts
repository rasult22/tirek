import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// ── 1. schools ──────────────────────────────────────────────────────
export const schools = pgTable("schools", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── 2. users ────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("student"), // student | psychologist | admin
  language: text("language").notNull().default("ru"),
  avatarId: text("avatar_id"),
  grade: integer("grade"),
  classLetter: text("class_letter"),
  schoolId: text("school_id").references(() => schools.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── 3. invite_codes ─────────────────────────────────────────────────
export const inviteCodes = pgTable("invite_codes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  psychologistId: text("psychologist_id")
    .notNull()
    .references(() => users.id),
  studentRealName: text("student_real_name").notNull(),
  grade: integer("grade"),
  classLetter: text("class_letter"),
  usedBy: text("used_by").references(() => users.id),
  usedAt: timestamp("used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── 4. student_psychologist ─────────────────────────────────────────
export const studentPsychologist = pgTable(
  "student_psychologist",
  {
    studentId: text("student_id")
      .notNull()
      .references(() => users.id),
    psychologistId: text("psychologist_id")
      .notNull()
      .references(() => users.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.studentId, t.psychologistId] }),
  }),
);

// ── 5. mood_entries ─────────────────────────────────────────────────
export const moodEntries = pgTable("mood_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  mood: integer("mood").notNull(), // 1-5
  energy: integer("energy"),
  sleepQuality: integer("sleep_quality"),
  stressLevel: integer("stress_level"),
  note: text("note"),
  factors: jsonb("factors"), // e.g. ["school","friends"]
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── 6. diagnostic_tests ─────────────────────────────────────────────
export const diagnosticTests = pgTable("diagnostic_tests", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameRu: text("name_ru").notNull(),
  nameKz: text("name_kz"),
  description: text("description"),
  questions: jsonb("questions").notNull(),
  scoringRules: jsonb("scoring_rules"),
  questionCount: integer("question_count").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── 7. test_assignments ─────────────────────────────────────────────
export const testAssignments = pgTable("test_assignments", {
  id: text("id").primaryKey(),
  testId: text("test_id")
    .notNull()
    .references(() => diagnosticTests.id),
  assignedBy: text("assigned_by")
    .notNull()
    .references(() => users.id),
  targetType: text("target_type").notNull(), // "class" | "student"
  targetGrade: integer("target_grade"),
  targetClassLetter: text("target_class_letter"),
  targetStudentId: text("target_student_id").references(() => users.id),
  dueDate: timestamp("due_date", { withTimezone: true }),
  // pending | in_progress | completed | expired | cancelled
  // pending — default for active; cancelled — set explicitly via cancel endpoint.
  // in_progress/completed/expired остаются вычисляемыми в student view.
  status: text("status").notNull().default("pending"),
  studentMessage: text("student_message"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── 8. diagnostic_sessions ──────────────────────────────────────────
export const diagnosticSessions = pgTable("diagnostic_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  testId: text("test_id")
    .notNull()
    .references(() => diagnosticTests.id),
  assignmentId: text("assignment_id").references(() => testAssignments.id),
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  totalScore: integer("total_score"),
  maxScore: integer("max_score"),
  severity: text("severity"), // "minimal" | "mild" | "moderate" | "severe"
  flaggedItems: jsonb("flagged_items"), // [{ questionIndex, answer, reason }]
});

// ── 9. diagnostic_answers ───────────────────────────────────────────
export const diagnosticAnswers = pgTable("diagnostic_answers", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => diagnosticSessions.id),
  questionIndex: integer("question_index").notNull(),
  answer: integer("answer").notNull(),
  score: integer("score"),
});

// ── 9a. diagnostic_ai_reports ───────────────────────────────────────
export const diagnosticAiReports = pgTable("diagnostic_ai_reports", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .unique()
    .references(() => diagnosticSessions.id),
  status: text("status").notNull().default("pending"), // "pending" | "ready" | "error"
  model: text("model"),
  summary: text("summary"),
  interpretation: text("interpretation"),
  riskFactors: jsonb("risk_factors"), // [{ factor, severity, evidence }]
  recommendations: jsonb("recommendations"), // [{ type, text }]
  trend: text("trend"),
  flaggedItems: jsonb("flagged_items"), // [{ questionIndex, reason }]
  tokensUsed: integer("tokens_used"),
  errorMessage: text("error_message"),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── 10. exercises ───────────────────────────────────────────────────
export const exercises = pgTable("exercises", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // "breathing" | "grounding" | "journaling" | etc.
  slug: text("slug").notNull().unique(),
  nameRu: text("name_ru").notNull(),
  nameKz: text("name_kz"),
  description: text("description"),
  config: jsonb("config"), // exercise-specific configuration
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── 11. exercise_completions ────────────────────────────────────────
export const exerciseCompletions = pgTable("exercise_completions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  durationSeconds: integer("duration_seconds"),
  completedAt: timestamp("completed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── 12. content_quotes ──────────────────────────────────────────────
export const contentQuotes = pgTable("content_quotes", {
  id: serial("id").primaryKey(),
  textRu: text("text_ru").notNull(),
  textKz: text("text_kz"),
  category: text("category"),
  author: text("author"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── 13a. crisis_signals ─────────────────────────────────────────────
// Унифицированные кризисные сигналы от всех источников (Urgent Help, AI-Friend, Test Session).
// Записываются и читаются через единый deep-модуль `modules/crisis-signals/index.ts`
// (`report()` и `feedFor()`); распределяются на Red Feed (acute_crisis) и Yellow Feed (concern).
export const crisisSignals = pgTable("crisis_signals", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(), // "acute_crisis" | "concern"
  severity: text("severity").notNull(), // "high" | "medium" | "low"
  source: text("source").notNull(), // "urgent_help" | "ai_friend" | "test_session"
  summary: text("summary").notNull(), // Signal Summary на языке Psychologist'а
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: text("resolved_by").references(() => users.id),
  resolutionNotes: text("resolution_notes"),
  contactedStudent: boolean("contacted_student").default(false).notNull(),
  contactedParent: boolean("contacted_parent").default(false).notNull(),
  documented: boolean("documented").default(false).notNull(),
});

// ── 13. sos_events ──────────────────────────────────────────────────
export const sosEvents = pgTable("sos_events", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  // SOS Action: 'breathing' | 'hotline' | 'chat' | 'urgent' (issue #11).
  // Nullable for legacy rows written under the old level-only schema.
  type: text("type"),
  // Legacy 1/2/3 severity. Nullable now: new code only writes `type`.
  level: integer("level"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: text("resolved_by").references(() => users.id),
  notes: text("notes"),
  contactedStudent: boolean("contacted_student").default(false).notNull(),
  contactedParent: boolean("contacted_parent").default(false).notNull(),
  documented: boolean("documented").default(false).notNull(),
});

// ── 14. chat_sessions ───────────────────────────────────────────────
export const chatSessions = pgTable("chat_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  mode: text("mode"), // legacy: "general" | "talk" | "problem" | "exam" | "discovery"; new sessions = null after #14
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
});

// ── 15. chat_messages ───────────────────────────────────────────────
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => chatSessions.id),
  role: text("role").notNull(), // "user" | "assistant" | "system"
  content: text("content").notNull(),
  flagged: boolean("flagged").default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── 16. user_streaks ────────────────────────────────────────────────
export const userStreaks = pgTable("user_streaks", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActiveDate: text("last_active_date"), // YYYY-MM-DD
  freezesAvailable: integer("freezes_available").notNull().default(1),
  freezeUsedDate: text("freeze_used_date"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── user_plants ────────────────────────────────────────────────────
export const userPlants = pgTable("user_plants", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  growthPoints: integer("growth_points").notNull().default(0),
  stage: integer("stage").notNull().default(1), // 1=sprout, 2=bush, 3=tree, 4=blooming
  name: text("name"),
  lastWateredAt: timestamp("last_watered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── 18. journal_entries ─────────────────────────────────────────────
export const journalEntries = pgTable("journal_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  prompt: text("prompt"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── 19. conversations (direct chat) ────────────────────────────────
export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id),
    psychologistId: text("psychologist_id")
      .notNull()
      .references(() => users.id),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    uniquePair: unique().on(t.studentId, t.psychologistId),
  }),
);

// ── 20. direct_messages ────────────────────────────────────────────
export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  flagged: boolean("flagged").default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── 21. office_hours ──────────────────────────────────────────────
// Per-day availability record for a psychologist (replaces legacy appointments model, issue #7).
export const officeHours = pgTable(
  "office_hours",
  {
    id: text("id").primaryKey(),
    psychologistId: text("psychologist_id")
      .notNull()
      .references(() => users.id),
    date: text("date").notNull(), // YYYY-MM-DD in Asia/Almaty
    intervals: jsonb("intervals").notNull(), // Array<{ start: "HH:mm", end: "HH:mm" }>
    notes: text("notes"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    uniquePsychologistDate: unique("office_hours_psychologist_id_date_unique").on(
      t.psychologistId,
      t.date,
    ),
  }),
);

// ── 25. cbt_entries ────────────────────────────────────────────────
export const cbtEntries = pgTable("cbt_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(), // "thought_diary"
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── 23. achievements ───────────────────────────────────────────────
export const achievements = pgTable("achievements", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(), // first_steps | streak | mastery | growth
  nameRu: text("name_ru").notNull(),
  nameKz: text("name_kz"),
  descriptionRu: text("description_ru"),
  descriptionKz: text("description_kz"),
  emoji: text("emoji").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── 24. user_achievements ──────────────────────────────────────────
export const userAchievements = pgTable(
  "user_achievements",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    achievementId: text("achievement_id")
      .notNull()
      .references(() => achievements.id),
    earnedAt: timestamp("earned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    uniqueUserAchievement: unique().on(t.userId, t.achievementId),
  }),
);
