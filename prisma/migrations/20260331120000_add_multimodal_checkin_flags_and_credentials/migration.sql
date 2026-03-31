-- Ensure pgvector extension exists in Neon/PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- Event-level check-in method toggles
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS face_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS qr_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS code_enabled BOOLEAN NOT NULL DEFAULT false;

-- Enforce at least one check-in method enabled per event
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_at_least_one_checkin_method'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_at_least_one_checkin_method
      CHECK (face_enabled OR qr_enabled OR code_enabled);
  END IF;
END $$;

-- Person-level credentials
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS qr_code_value TEXT,
  ADD COLUMN IF NOT EXISTS access_code TEXT;

-- Event participant-level credentials
ALTER TABLE event_participants
  ADD COLUMN IF NOT EXISTS qr_code_value TEXT,
  ADD COLUMN IF NOT EXISTS access_code TEXT;

-- Scoped indexes and unique constraints for credential lookup
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id_qr_code_value
  ON event_participants (event_id, qr_code_value)
  WHERE qr_code_value IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_participants_event_id_access_code
  ON event_participants (event_id, access_code)
  WHERE access_code IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'event_participants_event_id_qr_code_value_key'
  ) THEN
    ALTER TABLE event_participants
      ADD CONSTRAINT event_participants_event_id_qr_code_value_key
      UNIQUE (event_id, qr_code_value);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'event_participants_event_id_access_code_key'
  ) THEN
    ALTER TABLE event_participants
      ADD CONSTRAINT event_participants_event_id_access_code_key
      UNIQUE (event_id, access_code);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'people_organization_id_qr_code_value_key'
  ) THEN
    ALTER TABLE people
      ADD CONSTRAINT people_organization_id_qr_code_value_key
      UNIQUE (organization_id, qr_code_value);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'people_organization_id_access_code_key'
  ) THEN
    ALTER TABLE people
      ADD CONSTRAINT people_organization_id_access_code_key
      UNIQUE (organization_id, access_code);
  END IF;
END $$;

-- Backfill null credentials using same length used by totem access codes.
-- If no totem code exists, fallback to length 8.
WITH code_len AS (
  SELECT COALESCE(MAX(char_length(access_code)), 8)::int AS n
  FROM totems
  WHERE access_code IS NOT NULL
),
people_missing AS (
  SELECT p.id, c.n
  FROM people p
  CROSS JOIN code_len c
  WHERE p.qr_code_value IS NULL OR p.access_code IS NULL
)
UPDATE people p
SET
  qr_code_value = COALESCE(
    p.qr_code_value,
    upper(substr(md5(p.id || ':qr'), 1, people_missing.n))
  ),
  access_code = COALESCE(
    p.access_code,
    upper(substr(md5(p.id || ':code'), 1, people_missing.n))
  )
FROM people_missing
WHERE p.id = people_missing.id;

WITH code_len AS (
  SELECT COALESCE(MAX(char_length(access_code)), 8)::int AS n
  FROM totems
  WHERE access_code IS NOT NULL
),
ep_missing AS (
  SELECT ep.id, ep.event_id, ep.person_id, c.n
  FROM event_participants ep
  CROSS JOIN code_len c
  WHERE ep.qr_code_value IS NULL OR ep.access_code IS NULL
)
UPDATE event_participants ep
SET
  qr_code_value = COALESCE(
    ep.qr_code_value,
    upper(substr(md5(ep.event_id || ':' || ep.person_id || ':qr'), 1, ep_missing.n))
  ),
  access_code = COALESCE(
    ep.access_code,
    upper(substr(md5(ep.event_id || ':' || ep.person_id || ':code'), 1, ep_missing.n))
  )
FROM ep_missing
WHERE ep.id = ep_missing.id;
