CREATE TABLE IF NOT EXISTS "crisis_signals" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"source" text NOT NULL,
	"summary" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" text,
	"resolution_notes" text,
	"contacted_student" boolean DEFAULT false NOT NULL,
	"contacted_parent" boolean DEFAULT false NOT NULL,
	"documented" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crisis_signals" ADD CONSTRAINT "crisis_signals_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crisis_signals" ADD CONSTRAINT "crisis_signals_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crisis_signals_student_id_idx" ON "crisis_signals" ("student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crisis_signals_type_resolved_at_idx" ON "crisis_signals" ("type", "resolved_at");
