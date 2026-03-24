-- Fix drift: Prisma model expects timestamp lifecycle columns in totem_event_subscriptions.
ALTER TABLE totem_event_subscriptions
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);

-- Defensive backfill for environments where columns may have been manually created nullable.
UPDATE totem_event_subscriptions
SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL OR updated_at IS NULL;
