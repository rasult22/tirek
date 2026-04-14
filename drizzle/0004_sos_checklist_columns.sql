ALTER TABLE "sos_events" ADD COLUMN "contacted_student" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "sos_events" ADD COLUMN "contacted_parent" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "sos_events" ADD COLUMN "documented" boolean DEFAULT false NOT NULL;
