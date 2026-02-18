-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'IMPORT_DATA';
ALTER TYPE "AuditAction" ADD VALUE 'LABEL_CONFIG_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'LABEL_CONFIG_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'TOTEM_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'TOTEM_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'TOTEM_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'CHECK_IN_POINT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CHECK_IN_POINT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'CHECK_IN_POINT_DELETED';

-- AlterTable
ALTER TABLE "participants" ADD COLUMN     "company" TEXT,
ADD COLUMN     "job_title" TEXT;

-- CreateTable
CREATE TABLE "label_configs" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "paper_width" DOUBLE PRECISION NOT NULL DEFAULT 62,
    "paper_height" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "orientation" TEXT NOT NULL DEFAULT 'portrait',
    "margin_top" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "margin_right" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "margin_bottom" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "margin_left" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "show_fivents_logo" BOOLEAN NOT NULL DEFAULT true,
    "fivents_logo_position" TEXT NOT NULL DEFAULT 'top',
    "fivents_logo_size" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "show_org_logo" BOOLEAN NOT NULL DEFAULT true,
    "org_logo_position" TEXT NOT NULL DEFAULT 'top',
    "org_logo_size" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "show_qr_code" BOOLEAN NOT NULL DEFAULT true,
    "qr_code_position" TEXT NOT NULL DEFAULT 'center',
    "qr_code_size" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "qr_code_content" TEXT NOT NULL DEFAULT 'participant_id',
    "show_name" BOOLEAN NOT NULL DEFAULT true,
    "name_position" TEXT NOT NULL DEFAULT 'center',
    "name_font_size" DOUBLE PRECISION NOT NULL DEFAULT 16,
    "name_bold" BOOLEAN NOT NULL DEFAULT true,
    "show_company" BOOLEAN NOT NULL DEFAULT true,
    "company_position" TEXT NOT NULL DEFAULT 'center',
    "company_font_size" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "show_job_title" BOOLEAN NOT NULL DEFAULT true,
    "job_title_position" TEXT NOT NULL DEFAULT 'center',
    "job_title_font_size" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "items_order" TEXT NOT NULL DEFAULT '["fiventsLogo","orgLogo","name","company","jobTitle","qrCode"]',
    "printer_dpi" INTEGER NOT NULL DEFAULT 203,
    "printer_type" TEXT NOT NULL DEFAULT 'thermal',
    "print_speed" INTEGER NOT NULL DEFAULT 3,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "background_color" TEXT NOT NULL DEFAULT '#ffffff',
    "text_color" TEXT NOT NULL DEFAULT '#000000',
    "font_family" TEXT NOT NULL DEFAULT 'Arial',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "label_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "label_configs_event_id_key" ON "label_configs"("event_id");

-- AddForeignKey
ALTER TABLE "label_configs" ADD CONSTRAINT "label_configs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
