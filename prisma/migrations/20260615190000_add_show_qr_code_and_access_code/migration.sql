-- AlterTable
ALTER TABLE "print_configs" ADD COLUMN "show_qr_code" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "print_configs" ADD COLUMN "show_access_code" BOOLEAN NOT NULL DEFAULT false;
