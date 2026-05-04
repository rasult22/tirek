-- Issue #105: forgot-password флоу.
-- 4-знач. коды восстановления пароля. code хранится только bcrypt-хэшем (никогда plain).
-- TTL=15 минут. Один активный код на юзера: при новом запросе предыдущие
-- активные коды помечаются used_at = now(). attempts инкрементируется при
-- verify; 5 неудач блокируют код (used_at). Index по user_id для быстрых
-- запросов "active code" и "count за 15 минут" в rate-limiter.

CREATE TABLE "password_reset_codes" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "code_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "attempts" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "password_reset_codes"
  ADD CONSTRAINT "password_reset_codes_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "password_reset_codes_user_id_idx" ON "password_reset_codes" ("user_id");
