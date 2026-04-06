/*
  Warnings:

  - The primary key for the `check_in_metrics` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `person_check_in_cooldowns` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[public_slug]` on the table `events` will be added. If there are existing duplicate values, this will fail.
  - Made the column `low_quality_count` on table `check_in_metrics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `low_confidence_count` on table `check_in_metrics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cooldown_count` on table `check_in_metrics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `liveness_fail_count` on table `check_in_metrics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `check_in_metrics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `check_in_metrics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `liveness_threshold` on table `event_ai_configs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ef_search` on table `event_ai_configs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `top_k_candidates` on table `event_ai_configs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cooldown_seconds` on table `event_ai_configs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `failed_attempts` on table `person_check_in_cooldowns` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `person_check_in_cooldowns` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `person_check_in_cooldowns` required. This step will fail if there are existing NULL values in that column.
  - Made the column `embedding_model_version` on table `person_faces` required. This step will fail if there are existing NULL values in that column.
  - Made the column `embedding_normalized` on table `person_faces` required. This step will fail if there are existing NULL values in that column.
  - Made the column `confidence_threshold_adaptive` on table `totem_event_subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `confidence_threshold_min` on table `totem_event_subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `confidence_threshold_max` on table `totem_event_subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cooldown_strategy_type` on table `totem_event_subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cooldown_initial_ms` on table `totem_event_subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cooldown_max_ms` on table `totem_event_subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `total_check_ins` on table `totem_event_subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `success_check_ins` on table `totem_event_subscriptions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "idx_check_in_metrics_totem_event_subscription_id";

-- DropIndex
DROP INDEX "idx_event_participants_event_id_access_code";

-- DropIndex
DROP INDEX "idx_event_participants_event_id_qr_code_value";

-- DropIndex
DROP INDEX "idx_person_faces_embedding_vector_hnsw";

-- AlterTable
ALTER TABLE "check_in_metrics" DROP CONSTRAINT "check_in_metrics_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "totem_event_subscription_id" SET DATA TYPE TEXT,
ALTER COLUMN "event_id" SET DATA TYPE TEXT,
ALTER COLUMN "organization_id" SET DATA TYPE TEXT,
ALTER COLUMN "hour" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "low_quality_count" SET NOT NULL,
ALTER COLUMN "low_confidence_count" SET NOT NULL,
ALTER COLUMN "cooldown_count" SET NOT NULL,
ALTER COLUMN "liveness_fail_count" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "check_in_metrics_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "event_ai_configs" ALTER COLUMN "liveness_threshold" SET NOT NULL,
ALTER COLUMN "ef_search" SET NOT NULL,
ALTER COLUMN "top_k_candidates" SET NOT NULL,
ALTER COLUMN "cooldown_seconds" SET NOT NULL;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "public_slug" TEXT;

-- AlterTable
ALTER TABLE "person_check_in_cooldowns" DROP CONSTRAINT "person_check_in_cooldowns_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "event_participant_id" SET DATA TYPE TEXT,
ALTER COLUMN "event_id" SET DATA TYPE TEXT,
ALTER COLUMN "failed_attempts" SET NOT NULL,
ALTER COLUMN "cooldown_ends_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "last_attempt_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "reset_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "person_check_in_cooldowns_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "person_faces" ALTER COLUMN "embedding_model_version" SET NOT NULL,
ALTER COLUMN "embedding_model_version" SET DATA TYPE TEXT,
ALTER COLUMN "embedding_normalized" SET NOT NULL,
ALTER COLUMN "face_template_position" SET DATA TYPE TEXT,
ALTER COLUMN "template_set_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "totem_event_subscriptions" ALTER COLUMN "confidence_threshold_adaptive" SET NOT NULL,
ALTER COLUMN "confidence_threshold_min" SET NOT NULL,
ALTER COLUMN "confidence_threshold_max" SET NOT NULL,
ALTER COLUMN "cooldown_strategy_type" SET NOT NULL,
ALTER COLUMN "cooldown_strategy_type" SET DATA TYPE TEXT,
ALTER COLUMN "cooldown_initial_ms" SET NOT NULL,
ALTER COLUMN "cooldown_max_ms" SET NOT NULL,
ALTER COLUMN "last_check_in_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "total_check_ins" SET NOT NULL,
ALTER COLUMN "success_check_ins" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "event_participants_event_id_qr_code_value_idx" ON "event_participants"("event_id", "qr_code_value");

-- CreateIndex
CREATE INDEX "event_participants_event_id_access_code_idx" ON "event_participants"("event_id", "access_code");

-- CreateIndex
CREATE UNIQUE INDEX "events_public_slug_key" ON "events"("public_slug");

-- RenameIndex
ALTER INDEX "check_in_metrics_unique" RENAME TO "check_in_metrics_totem_event_subscription_id_hour_key";

-- RenameIndex
ALTER INDEX "idx_check_in_metrics_event_id" RENAME TO "check_in_metrics_event_id_idx";

-- RenameIndex
ALTER INDEX "idx_check_in_metrics_hour" RENAME TO "check_in_metrics_hour_idx";

-- RenameIndex
ALTER INDEX "idx_check_in_metrics_organization_id" RENAME TO "check_in_metrics_organization_id_idx";

-- RenameIndex
ALTER INDEX "idx_person_check_in_cooldown_cooldown_ends_at" RENAME TO "person_check_in_cooldowns_cooldown_ends_at_idx";

-- RenameIndex
ALTER INDEX "idx_person_check_in_cooldown_event_id" RENAME TO "person_check_in_cooldowns_event_id_idx";

-- RenameIndex
ALTER INDEX "idx_person_check_in_cooldown_event_participant_id" RENAME TO "person_check_in_cooldowns_event_participant_id_idx";

-- RenameIndex
ALTER INDEX "person_check_in_cooldown_unique" RENAME TO "person_check_in_cooldowns_event_participant_id_event_id_key";

-- RenameIndex
ALTER INDEX "idx_person_faces_embedding_model_version" RENAME TO "person_faces_embedding_model_version_idx";

-- RenameIndex
ALTER INDEX "idx_person_faces_template_set_id" RENAME TO "person_faces_template_set_id_idx";
