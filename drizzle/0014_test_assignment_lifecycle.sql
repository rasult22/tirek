-- Issue #40: расширяем test_assignments для lifecycle статусов и сообщения ученику.
-- - student_message: опциональное сообщение от психолога ("пожалуйста, пройди этот тест...").
-- - cancelled_at: момент отмены назначения.
-- - status: persistent поле для cancelled-флага. Остальные значения
--   (in_progress | completed | expired) продолжают вычисляться в student view
--   через diagnostic_sessions; мы храним только pending/cancelled явно.

ALTER TABLE "test_assignments"
  ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "student_message" text,
  ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp with time zone;
