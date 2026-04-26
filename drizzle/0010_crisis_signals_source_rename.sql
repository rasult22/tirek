-- Rename Crisis Signal source values to align with UBIQUITOUS_LANGUAGE
-- and the deep-module API exposed by `crisisSignalsModule.report()`:
--   sos_urgent  -> urgent_help    (matches "Urgent Help" SOS Action)
--   diagnostics -> test_session   (matches "Test Session" domain term)
--   ai_friend   -> ai_friend      (unchanged)
UPDATE "crisis_signals" SET "source" = 'urgent_help'  WHERE "source" = 'sos_urgent';
UPDATE "crisis_signals" SET "source" = 'test_session' WHERE "source" = 'diagnostics';
