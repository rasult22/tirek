-- Issue #113: soft delete для App Store 5.1.1(v).
-- deleted_at NULL = аккаунт активен; ставится один раз в repository.softDeleteUser
-- одновременно с анонимизацией email/name/password_hash. Login и /me фильтруют
-- deleted_at IS NULL. Связанные ученики и история сообщений сохраняются.

ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;
