-- Persist Flagged Items on each Test Session so Risk Status Calculator
-- can apply the safety override (e.g. PHQ-A item 9 ≥ 1 with mild totalScore
-- still escalates Student to Risk Status = crisis).
ALTER TABLE "diagnostic_sessions" ADD COLUMN "flagged_items" jsonb;
