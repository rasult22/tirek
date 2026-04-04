CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"flagged" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"mode" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "content_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"text_ru" text NOT NULL,
	"text_kz" text,
	"category" text,
	"author" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagnostic_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"question_index" integer NOT NULL,
	"answer" integer NOT NULL,
	"score" integer
);
--> statement-breakpoint
CREATE TABLE "diagnostic_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"test_id" text NOT NULL,
	"assignment_id" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"total_score" integer,
	"max_score" integer,
	"severity" text
);
--> statement-breakpoint
CREATE TABLE "diagnostic_tests" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_ru" text NOT NULL,
	"name_kz" text,
	"description" text,
	"questions" jsonb NOT NULL,
	"scoring_rules" jsonb,
	"question_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diagnostic_tests_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "exercise_completions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"exercise_id" text NOT NULL,
	"duration_seconds" integer,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"slug" text NOT NULL,
	"name_ru" text NOT NULL,
	"name_kz" text,
	"description" text,
	"config" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercises_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "invite_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"psychologist_id" text NOT NULL,
	"grade" integer,
	"class_letter" text,
	"school_id" text,
	"used_by" text,
	"used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invite_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "mood_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"mood" integer NOT NULL,
	"energy" integer,
	"sleep_quality" integer,
	"stress_level" integer,
	"note" text,
	"factors" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"read" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "psychologist_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"psychologist_id" text NOT NULL,
	"student_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sos_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"level" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "student_psychologist" (
	"student_id" text NOT NULL,
	"psychologist_id" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_psychologist_student_id_psychologist_id_pk" PRIMARY KEY("student_id","psychologist_id")
);
--> statement-breakpoint
CREATE TABLE "test_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"assigned_by" text NOT NULL,
	"target_type" text NOT NULL,
	"target_grade" integer,
	"target_class_letter" text,
	"target_student_id" text,
	"due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"language" text DEFAULT 'ru' NOT NULL,
	"avatar_id" text,
	"grade" integer,
	"class_letter" text,
	"school_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_answers" ADD CONSTRAINT "diagnostic_answers_session_id_diagnostic_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."diagnostic_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_test_id_diagnostic_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."diagnostic_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_assignment_id_test_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."test_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_completions" ADD CONSTRAINT "exercise_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_completions" ADD CONSTRAINT "exercise_completions_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_psychologist_id_users_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_used_by_users_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_notes" ADD CONSTRAINT "psychologist_notes_psychologist_id_users_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psychologist_notes" ADD CONSTRAINT "psychologist_notes_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sos_events" ADD CONSTRAINT "sos_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sos_events" ADD CONSTRAINT "sos_events_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_psychologist" ADD CONSTRAINT "student_psychologist_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_psychologist" ADD CONSTRAINT "student_psychologist_psychologist_id_users_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_assignments" ADD CONSTRAINT "test_assignments_test_id_diagnostic_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."diagnostic_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_assignments" ADD CONSTRAINT "test_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_assignments" ADD CONSTRAINT "test_assignments_target_student_id_users_id_fk" FOREIGN KEY ("target_student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;