-- Drop legacy booking model (appointments/slots) in favour of OfficeHours info-block (issue #7).
-- Order matters: appointments references appointment_slots.id via slot_id.
DROP TABLE IF EXISTS "appointments";
--> statement-breakpoint
DROP TABLE IF EXISTS "appointment_slots";
--> statement-breakpoint
-- Per-day flexible availability record (Variant A per PRD).
CREATE TABLE "office_hours" (
  "id" text PRIMARY KEY NOT NULL,
  "psychologist_id" text NOT NULL,
  "date" text NOT NULL,
  "intervals" jsonb NOT NULL,
  "notes" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "office_hours_psychologist_id_date_unique" UNIQUE("psychologist_id","date")
);
--> statement-breakpoint
ALTER TABLE "office_hours" ADD CONSTRAINT "office_hours_psychologist_id_users_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "office_hours_psychologist_date_idx" ON "office_hours" ("psychologist_id","date");
