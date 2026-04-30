-- Legacy totem code check-ins were previously persisted as MANUAL.
-- Keep MANUAL reserved for app/operator check-ins and normalize historical data.
UPDATE "check_ins"
SET "method" = 'ACCESS_CODE'
WHERE "method" = 'MANUAL'
  AND "totem_event_subscription_id" IS NOT NULL;
