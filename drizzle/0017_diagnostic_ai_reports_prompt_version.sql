-- Issue #101: persist the prompt version each AI report was generated under.
-- We bump PROMPT_VERSION in code whenever the system prompt or payload schema
-- materially changes; keeping the value alongside the report makes runtime
-- behaviour reproducible when investigating a complaint. Existing reports
-- remain NULL — only newly generated reports record their version.
ALTER TABLE "diagnostic_ai_reports" ADD COLUMN "prompt_version" text;
