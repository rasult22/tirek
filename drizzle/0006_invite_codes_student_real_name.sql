-- Add student_real_name to invite_codes.
-- Safe rollout: add nullable, backfill legacy rows, enforce NOT NULL.
ALTER TABLE "invite_codes" ADD COLUMN "student_real_name" text;
--> statement-breakpoint
UPDATE "invite_codes" SET "student_real_name" = 'Неизвестно' WHERE "student_real_name" IS NULL;
--> statement-breakpoint
ALTER TABLE "invite_codes" ALTER COLUMN "student_real_name" SET NOT NULL;
--> statement-breakpoint
-- Drop legacy school_id: identity moves to psychologist-only via users.school_id.
ALTER TABLE "invite_codes" DROP CONSTRAINT IF EXISTS "invite_codes_school_id_schools_id_fk";
--> statement-breakpoint
ALTER TABLE "invite_codes" DROP COLUMN IF EXISTS "school_id";
