-- Explicit on/off switch for badge printing per event.
-- Until now "off" was inferred from print_config_id IS NULL, which is also the state of a
-- brand-new event, making "never configured" and "deliberately disabled" indistinguishable.
ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "print_enabled" BOOLEAN NOT NULL DEFAULT true;

-- Preserve current behaviour for existing rows: printing was effectively off wherever no
-- print config was linked.
UPDATE "events" SET "print_enabled" = false WHERE "print_config_id" IS NULL;
