-- CreateEnum
CREATE TYPE "EmailLogStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "email_settings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "api_key" TEXT,
    "from_name" TEXT NOT NULL DEFAULT 'OneID',
    "from_email" TEXT,
    "reply_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "event_id" TEXT,
    "participant_id" TEXT,
    "recipient" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" "EmailLogStatus" NOT NULL DEFAULT 'PENDING',
    "provider_msg_id" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_settings_organization_id_key" ON "email_settings"("organization_id");

-- CreateIndex
CREATE INDEX "email_logs_organization_id_idx" ON "email_logs"("organization_id");

-- CreateIndex
CREATE INDEX "email_logs_event_id_idx" ON "email_logs"("event_id");

-- CreateIndex
CREATE INDEX "email_logs_participant_id_idx" ON "email_logs"("participant_id");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_created_at_idx" ON "email_logs"("created_at");

-- AddForeignKey
ALTER TABLE "email_settings" ADD CONSTRAINT "email_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
