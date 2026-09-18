-- Sympla integration foundation: encrypted per-organization connection + a Postgres-backed
-- job queue (there is no worker process; /api/cron drains it).

-- ── Enums ──────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SymplaSyncStatus') THEN
    CREATE TYPE "SymplaSyncStatus" AS ENUM ('IDLE', 'SYNCING', 'COMPLETED', 'FAILED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BackgroundJobStatus') THEN
    CREATE TYPE "BackgroundJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
  END IF;
END
$$;

-- New audit actions. ADD VALUE is safe here because none of these values is referenced
-- by a query in this same migration.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SYMPLA_CONNECTION_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SYMPLA_CONNECTION_REMOVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SYMPLA_EVENT_LINKED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SYMPLA_EVENT_UNLINKED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SYMPLA_SYNC_STARTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SYMPLA_SYNC_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SYMPLA_SYNC_FAILED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SYMPLA_CHECKIN_MIRRORED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SYMPLA_CHECKIN_RECONCILED';

-- ── sympla_connections ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sympla_connections" (
  "id"                   TEXT NOT NULL,
  "organization_id"      TEXT NOT NULL,
  "token_encrypted"      JSONB NOT NULL,
  "is_active"            BOOLEAN NOT NULL DEFAULT true,
  "last_sync_at"         TIMESTAMP(3),
  "last_sync_status"     "SymplaSyncStatus" NOT NULL DEFAULT 'IDLE',
  "last_sync_result"     JSONB,
  "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
  "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"           TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sympla_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sympla_connections_organization_id_key"
  ON "sympla_connections"("organization_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sympla_connections_organization_id_fkey'
  ) THEN
    ALTER TABLE "sympla_connections"
      ADD CONSTRAINT "sympla_connections_organization_id_fkey"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- ── background_jobs ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "background_jobs" (
  "id"              TEXT NOT NULL,
  "kind"            TEXT NOT NULL,
  "dedupe_key"      TEXT,
  "payload"         JSONB NOT NULL,
  "status"          "BackgroundJobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts"        INTEGER NOT NULL DEFAULT 0,
  "max_attempts"    INTEGER NOT NULL DEFAULT 5,
  "run_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "locked_at"       TIMESTAMP(3),
  "last_error"      TEXT,
  "organization_id" TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL,
  "completed_at"    TIMESTAMP(3),
  CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "background_jobs_dedupe_key_key" ON "background_jobs"("dedupe_key");
CREATE INDEX IF NOT EXISTS "background_jobs_status_run_at_idx" ON "background_jobs"("status", "run_at");
CREATE INDEX IF NOT EXISTS "background_jobs_organization_id_idx" ON "background_jobs"("organization_id");
CREATE INDEX IF NOT EXISTS "background_jobs_kind_idx" ON "background_jobs"("kind");
