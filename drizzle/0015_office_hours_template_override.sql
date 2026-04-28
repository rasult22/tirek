-- Issue #44: Office Hours рефакторинг на двухуровневую модель.
-- (a) Сначала дропаем старую office_hours — пилот ещё не идёт, данные не нужны.
-- (b) Создаём office_hours_override (та же структура, что была у office_hours).
-- (c) Создаём office_hours_template — недельный шаблон по dayOfWeek (ISO 1=Mon … 7=Sun).
-- Правило резолвинга реализуется в коде (resolver.ts), не в БД.

DROP TABLE IF EXISTS "office_hours" CASCADE;
--> statement-breakpoint

CREATE TABLE "office_hours_override" (
  "id" text PRIMARY KEY NOT NULL,
  "psychologist_id" text NOT NULL,
  "date" text NOT NULL,
  "intervals" jsonb NOT NULL,
  "notes" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "office_hours_override_psychologist_id_date_unique" UNIQUE("psychologist_id","date")
);
--> statement-breakpoint
ALTER TABLE "office_hours_override"
  ADD CONSTRAINT "office_hours_override_psychologist_id_users_id_fk"
  FOREIGN KEY ("psychologist_id") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "office_hours_override_psychologist_date_idx"
  ON "office_hours_override" ("psychologist_id","date");
--> statement-breakpoint

CREATE TABLE "office_hours_template" (
  "id" text PRIMARY KEY NOT NULL,
  "psychologist_id" text NOT NULL,
  "day_of_week" integer NOT NULL,
  "intervals" jsonb NOT NULL,
  "notes" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "office_hours_template_psychologist_id_day_of_week_unique"
    UNIQUE("psychologist_id","day_of_week"),
  CONSTRAINT "office_hours_template_day_of_week_check"
    CHECK ("day_of_week" BETWEEN 1 AND 7)
);
--> statement-breakpoint
ALTER TABLE "office_hours_template"
  ADD CONSTRAINT "office_hours_template_psychologist_id_users_id_fk"
  FOREIGN KEY ("psychologist_id") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "office_hours_template_psychologist_idx"
  ON "office_hours_template" ("psychologist_id");
