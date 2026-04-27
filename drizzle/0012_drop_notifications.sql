-- Drop notifications inbox: bell icon + screen + table (issue #30).
-- All signal pipelines (achievements, direct chat, crisis signals, productive actions)
-- now write only their own state; tab badges (Crises, Messages) cover the user-visible delta.
DROP TABLE IF EXISTS "notifications";
