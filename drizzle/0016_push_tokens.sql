-- Issue #47: Push Notification infrastructure.
-- Таблица регистрации Expo push tokens устройств. Token — primary key (один токен = одно устройство, всегда уникален).
-- При смене user (logout/login на одном девайсе) делаем upsert по token: меняем user_id и обновляем last_seen_at.

CREATE TABLE "push_tokens" (
  "token" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "platform" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "push_tokens"
  ADD CONSTRAINT "push_tokens_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "push_tokens_user_id_idx" ON "push_tokens" ("user_id");
