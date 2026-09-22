-- Decouples Person from EventParticipant so a single event can hold several tickets that share
-- an e-mail or a document.
--
-- Why: a Sympla bulk purchase is one order with N tickets for N different attendees, and the
-- buyer routinely repeats their own e-mail/CPF across all of them (or leaves them blank).
-- The current model forbids that three times over: people.email and people.document are unique
-- per organization, and event_participants is unique per (person, event).
--
-- After this migration EventParticipant is the ticket — an autonomous participation slot that
-- carries its own attendee snapshot. Person becomes an optional identity layered on top of it,
-- needed only for facial recognition, cross-event history and the organization's contact base.

-- ── Person: relax identity ─────────────────────────────────────────

-- A ticket can arrive with no e-mail at all, so the Person created for it may have none either.
ALTER TABLE "people" ALTER COLUMN "email" DROP NOT NULL;

DROP INDEX IF EXISTS "people_email_organization_id_key";
DROP INDEX IF EXISTS "people_document_organization_id_key";

-- The lookups those unique indexes were also serving still need to be fast.
CREATE INDEX IF NOT EXISTS "people_organization_id_email_idx" ON "people"("organization_id", "email");
CREATE INDEX IF NOT EXISTS "people_organization_id_document_idx" ON "people"("organization_id", "document");

-- ── EventParticipant: the ticket slot ──────────────────────────────

ALTER TABLE "event_participants" ALTER COLUMN "person_id" DROP NOT NULL;

-- One Person may now hold several tickets for the same event.
DROP INDEX IF EXISTS "event_participants_person_id_event_id_key";

-- Attendee snapshot, independent of Person. This is what the totem greets and the badge prints
-- when a slot has no identity attached.
ALTER TABLE "event_participants"
  ADD COLUMN IF NOT EXISTS "attendee_full_name" TEXT,
  ADD COLUMN IF NOT EXISTS "attendee_email" TEXT,
  ADD COLUMN IF NOT EXISTS "attendee_document" TEXT,
  ADD COLUMN IF NOT EXISTS "attendee_document_type" "DocumentType";

-- Backfill from the linked Person so existing participants render identically after the change.
UPDATE "event_participants" ep
SET "attendee_full_name" = p."name",
    "attendee_email" = p."email",
    "attendee_document" = p."document",
    "attendee_document_type" = p."document_type"
FROM "people" p
WHERE p."id" = ep."person_id"
  AND ep."attendee_full_name" IS NULL;

CREATE INDEX IF NOT EXISTS "event_participants_event_id_attendee_email_idx"
  ON "event_participants"("event_id", "attendee_email");
CREATE INDEX IF NOT EXISTS "event_participants_event_id_attendee_document_idx"
  ON "event_participants"("event_id", "attendee_document");
