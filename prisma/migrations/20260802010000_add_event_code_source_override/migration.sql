-- Per-event override of OrganizationPeopleSettings' access code / QR code sources.
-- NULL means "inherit the organization default".
ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "access_code_source" "CodeSourceField",
  ADD COLUMN IF NOT EXISTS "qr_code_source" "CodeSourceField";
