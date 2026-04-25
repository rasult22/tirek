-- SOS redesign (issue #11): one button → 4 actions.
-- New column "type" stores SOS Action: breathing | hotline | chat | urgent.
-- Old "level" column kept for backwards compatibility with existing rows;
-- new code stops writing it, so we must drop the NOT NULL constraint.
ALTER TABLE "sos_events" ADD COLUMN "type" text;
--> statement-breakpoint
ALTER TABLE "sos_events" ALTER COLUMN "level" DROP NOT NULL;
