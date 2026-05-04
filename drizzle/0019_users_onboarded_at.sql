-- Issue #112: онбординг как server-side флаг.
-- onboarded_at NULL = онбординг ещё не пройден; ставится один раз в
-- repository.markOnboardedNow (WHERE ... AND onboarded_at IS NULL для идемпотентности).
-- Существующие психологи имеют NULL и увидят онбординг один раз — допустимо для пилота.

ALTER TABLE "users" ADD COLUMN "onboarded_at" timestamp with time zone;
