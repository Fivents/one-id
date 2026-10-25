-- Sympla catalogue (event link, presentations, sectors, ticket types, orders) and the ticket
-- columns on the participation slot.

-- ── events ─────────────────────────────────────────────────────────

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "sympla_linked" BOOLEAN NOT NULL DEFAULT false;

-- ── event_participants: the ticket itself ──────────────────────────

ALTER TABLE "event_participants"
  ADD COLUMN IF NOT EXISTS "sympla_participant_id" TEXT,
  ADD COLUMN IF NOT EXISTS "ticket_number" TEXT,
  ADD COLUMN IF NOT EXISTS "ticket_status" TEXT,
  ADD COLUMN IF NOT EXISTS "ticket_name" TEXT,
  ADD COLUMN IF NOT EXISTS "ticket_price" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "ticket_net_value" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "sector_name" TEXT,
  ADD COLUMN IF NOT EXISTS "seat_label" TEXT,
  ADD COLUMN IF NOT EXISTS "sympla_checked_in" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "sympla_check_in_date" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sympla_check_in_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "custom_fields" JSONB,
  ADD COLUMN IF NOT EXISTS "presentation_id" TEXT,
  ADD COLUMN IF NOT EXISTS "order_id" TEXT;

-- Idempotency anchor of the ingestion. Postgres treats NULLs as distinct, so every
-- pre-existing (non-Sympla) participant keeps working.
CREATE UNIQUE INDEX IF NOT EXISTS "event_participants_event_id_ticket_number_key"
  ON "event_participants"("event_id", "ticket_number");
CREATE INDEX IF NOT EXISTS "event_participants_event_id_sympla_participant_id_idx"
  ON "event_participants"("event_id", "sympla_participant_id");
CREATE INDEX IF NOT EXISTS "event_participants_presentation_id_idx" ON "event_participants"("presentation_id");
CREATE INDEX IF NOT EXISTS "event_participants_order_id_idx" ON "event_participants"("order_id");

-- ── sympla_event_links ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sympla_event_links" (
  "id"                   TEXT NOT NULL,
  "event_id"             TEXT NOT NULL,
  "sympla_event_id_hash" TEXT NOT NULL,
  "sympla_url"           TEXT,
  "image_url"            TEXT,
  "reference_id"         INTEGER,
  "category_primary"     TEXT,
  "category_secondary"   TEXT,
  "host_name"            TEXT,
  "published_on_sympla"  BOOLEAN NOT NULL DEFAULT false,
  "cancelled_on_sympla"  BOOLEAN NOT NULL DEFAULT false,
  "last_seed_at"         TIMESTAMP(3),
  "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"           TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sympla_event_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sympla_event_links_event_id_key" ON "sympla_event_links"("event_id");
CREATE UNIQUE INDEX IF NOT EXISTS "sympla_event_links_sympla_event_id_hash_key"
  ON "sympla_event_links"("sympla_event_id_hash");

-- ── presentations ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "presentations" (
  "id"                     TEXT NOT NULL,
  "event_id"               TEXT NOT NULL,
  "sympla_presentation_id" INTEGER NOT NULL,
  "name"                   TEXT,
  "starts_at"              TIMESTAMP(3) NOT NULL,
  "ends_at"                TIMESTAMP(3),
  "is_closed"              BOOLEAN NOT NULL DEFAULT false,
  "is_enabled"             BOOLEAN NOT NULL DEFAULT true,
  "is_published"           BOOLEAN NOT NULL DEFAULT true,
  "is_private"             BOOLEAN NOT NULL DEFAULT false,
  "presentation_url"       TEXT,
  "created_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"             TIMESTAMP(3) NOT NULL,
  CONSTRAINT "presentations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "presentations_event_id_sympla_presentation_id_key"
  ON "presentations"("event_id", "sympla_presentation_id");
CREATE INDEX IF NOT EXISTS "presentations_event_id_idx" ON "presentations"("event_id");

-- ── sectors ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sectors" (
  "id"               TEXT NOT NULL,
  "event_id"         TEXT NOT NULL,
  "presentation_id"  TEXT,
  "name"             TEXT NOT NULL,
  "sympla_sector_id" INTEGER,
  "has_online_sale"  BOOLEAN NOT NULL DEFAULT false,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sectors_event_id_presentation_id_name_key"
  ON "sectors"("event_id", "presentation_id", "name");
CREATE INDEX IF NOT EXISTS "sectors_event_id_idx" ON "sectors"("event_id");
CREATE INDEX IF NOT EXISTS "sectors_presentation_id_idx" ON "sectors"("presentation_id");

-- ── ticket_types ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ticket_types" (
  "id"            TEXT NOT NULL,
  "event_id"      TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "group_id"      INTEGER,
  "group_name"    TEXT,
  "subgroup_id"   INTEGER,
  "subgroup_name" TEXT,
  "sale_price"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "net_value"     DOUBLE PRECISION,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ticket_types_event_id_name_key" ON "ticket_types"("event_id", "name");
CREATE INDEX IF NOT EXISTS "ticket_types_event_id_idx" ON "ticket_types"("event_id");

-- ── sympla_orders ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sympla_orders" (
  "id"               TEXT NOT NULL,
  "event_id"         TEXT NOT NULL,
  "sympla_order_sk"  TEXT NOT NULL,
  "order_status"     TEXT,
  "order_date"       TIMESTAMP(3),
  "approved_date"    TIMESTAMP(3),
  "updated_date"     TIMESTAMP(3),
  "buyer_first_name" TEXT,
  "buyer_last_name"  TEXT,
  "buyer_email"      TEXT,
  "total_sale_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total_net_value"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discount_code"    TEXT,
  "transaction_type" TEXT,
  "presentation_id"  INTEGER,
  "invoice_info"     JSONB,
  "utm_tracking"     JSONB,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sympla_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sympla_orders_event_id_sympla_order_sk_key"
  ON "sympla_orders"("event_id", "sympla_order_sk");
CREATE INDEX IF NOT EXISTS "sympla_orders_event_id_idx" ON "sympla_orders"("event_id");
CREATE INDEX IF NOT EXISTS "sympla_orders_buyer_email_idx" ON "sympla_orders"("buyer_email");

-- ── foreign keys ───────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sympla_event_links_event_id_fkey') THEN
    ALTER TABLE "sympla_event_links" ADD CONSTRAINT "sympla_event_links_event_id_fkey"
      FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'presentations_event_id_fkey') THEN
    ALTER TABLE "presentations" ADD CONSTRAINT "presentations_event_id_fkey"
      FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sectors_event_id_fkey') THEN
    ALTER TABLE "sectors" ADD CONSTRAINT "sectors_event_id_fkey"
      FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sectors_presentation_id_fkey') THEN
    ALTER TABLE "sectors" ADD CONSTRAINT "sectors_presentation_id_fkey"
      FOREIGN KEY ("presentation_id") REFERENCES "presentations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ticket_types_event_id_fkey') THEN
    ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_event_id_fkey"
      FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sympla_orders_event_id_fkey') THEN
    ALTER TABLE "sympla_orders" ADD CONSTRAINT "sympla_orders_event_id_fkey"
      FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_participants_presentation_id_fkey') THEN
    ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_presentation_id_fkey"
      FOREIGN KEY ("presentation_id") REFERENCES "presentations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_participants_order_id_fkey') THEN
    ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_order_id_fkey"
      FOREIGN KEY ("order_id") REFERENCES "sympla_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;
