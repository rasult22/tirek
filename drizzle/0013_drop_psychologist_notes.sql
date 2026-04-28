-- Drop Private Notes feature: psychologist's notes about students (issue #37).
-- Feature was added by analogy with other SaaS, never validated; on the pilot
-- it would create parasitic anxiety ("I'm a bad psychologist, I don't use it").
-- Note: `notes` column in office_hours_* tables is unrelated (interval label) and stays.
DROP TABLE IF EXISTS "psychologist_notes";
