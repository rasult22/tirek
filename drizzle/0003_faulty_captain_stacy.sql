CREATE TABLE "diagnostic_ai_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"model" text,
	"summary" text,
	"interpretation" text,
	"risk_factors" jsonb,
	"recommendations" jsonb,
	"trend" text,
	"flagged_items" jsonb,
	"tokens_used" integer,
	"error_message" text,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diagnostic_ai_reports_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "diagnostic_ai_reports" ADD CONSTRAINT "diagnostic_ai_reports_session_id_diagnostic_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."diagnostic_sessions"("id") ON DELETE no action ON UPDATE no action;