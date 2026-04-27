-- Add event-level label print confirmation settings for totem flows
ALTER TABLE "events"
ADD COLUMN "label_print_prompt_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "label_print_prompt_timeout_seconds" INTEGER NOT NULL DEFAULT 15;

-- Add participant-level flag to use person document as access code
ALTER TABLE "event_participants"
ADD COLUMN "use_document_as_access_code" BOOLEAN NOT NULL DEFAULT false;
