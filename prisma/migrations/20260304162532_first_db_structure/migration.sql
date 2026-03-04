-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ORG_OWNER', 'EVENT_MANAGER');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CheckInMethod" AS ENUM ('FACE_RECOGNITION', 'QR_CODE', 'MANUAL');

-- CreateEnum
CREATE TYPE "TotemStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "PlanRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'ORGANIZATION', 'TOTEM', 'SYSTEM');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('USER', 'ORGANIZATION', 'EVENT', 'TOTEM', 'CHECK_IN', 'SUBSCRIPTION', 'PLAN');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PLAN_REQUEST', 'PLAN_APPROVED', 'PLAN_REJECTED', 'LIMIT_WARNING', 'EXPIRATION_WARNING', 'NEW_MEMBER', 'EVENT_CREATED', 'SYSTEM_MESSAGE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'IN_APP', 'SMS');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PASSPORT', 'ID_CARD', 'DRIVER_LICENSE', 'OTHER');

-- CreateEnum
CREATE TYPE "PrintOrientation" AS ENUM ('PORTRAIT', 'LANDSCAPE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CHECK_IN', 'CHECK_IN_APPROVED', 'CHECK_IN_DENIED', 'TOTEM_AUTH', 'TOTEM_AUTH_SUCCESS', 'TOTEM_AUTH_FAILED', 'PARTICIPANT_CREATED', 'PARTICIPANT_UPDATED', 'PARTICIPANT_DELETED', 'EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_DELETED', 'USER_LOGIN', 'USER_LOGOUT', 'FACE_REGISTERED', 'FACE_UPDATED', 'FACE_DELETED', 'EXPORT_DATA', 'IMPORT_DATA', 'PRINT_CONFIG_CREATED', 'PRINT_CONFIG_UPDATED', 'TOTEM_CREATED', 'TOTEM_UPDATED', 'TOTEM_DELETED', 'PLAN_CREATED', 'PLAN_UPDATED', 'PLAN_DELETED', 'PLAN_CHANGE_REQUESTED', 'PLAN_CHANGE_APPROVED', 'PLAN_CHANGE_REJECTED', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_PASSWORD_RESET', 'ORG_CREATED', 'ORG_UPDATED', 'ORG_DELETED', 'ORG_ACTIVATED', 'ORG_DEACTIVATED', 'TOTEM_LINKED', 'TOTEM_UNLINKED', 'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPDATED', 'SUBSCRIPTION_DELETED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EVENT_MANAGER',
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_identities" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "password_hash" TEXT,
    "allow_access" BOOLEAN NOT NULL DEFAULT true,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "auth_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "timezone" TEXT NOT NULL,
    "address" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "organization_id" TEXT NOT NULL,
    "print_config_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "totems" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "access_code" TEXT NOT NULL,
    "status" "TotemStatus" NOT NULL DEFAULT 'ACTIVE',
    "price" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL,
    "last_heartbeat" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "totems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "totem_sessions" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "totem_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "totem_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "totem_organization_subscriptions" (
    "id" TEXT NOT NULL,
    "totem_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "totem_organization_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "totem_event_subscriptions" (
    "id" TEXT NOT NULL,
    "location_name" TEXT NOT NULL,
    "totem_organization_subscription_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "totem_event_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "document" TEXT,
    "document_type" "DocumentType",
    "phone" TEXT,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_faces" (
    "id" TEXT NOT NULL,
    "embedding" BYTEA NOT NULL,
    "image_hash" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "person_faces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participants" (
    "id" TEXT NOT NULL,
    "company" TEXT,
    "job_title" TEXT,
    "person_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "method" "CheckInMethod" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "checked_in_at" TIMESTAMP(3) NOT NULL,
    "event_participant_id" TEXT NOT NULL,
    "totem_event_subscription_id" TEXT NOT NULL,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "session_id" TEXT,
    "organization_id" TEXT,
    "user_id" TEXT,
    "event_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_configs" (
    "id" TEXT NOT NULL,
    "paper_width" DOUBLE PRECISION NOT NULL DEFAULT 62,
    "paper_height" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "orientation" "PrintOrientation" NOT NULL DEFAULT 'PORTRAIT',
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

    CONSTRAINT "print_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_features" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "feature_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_change_requests" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "PlanRequestStatus" NOT NULL DEFAULT 'PENDING',
    "organization_id" TEXT NOT NULL,
    "current_plan_id" TEXT NOT NULL,
    "requested_plan_id" TEXT NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_id" TEXT,
    "resolved_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "memberships_organization_id_idx" ON "memberships"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_user_id_organization_id_key" ON "memberships"("user_id", "organization_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "auth_identities_user_id_idx" ON "auth_identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_identities_provider_provider_id_key" ON "auth_identities"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "events_organization_id_idx" ON "events"("organization_id");

-- CreateIndex
CREATE INDEX "events_print_config_id_idx" ON "events"("print_config_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_organization_id_key" ON "events"("slug", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "totems_access_code_key" ON "totems"("access_code");

-- CreateIndex
CREATE INDEX "totem_sessions_totem_id_idx" ON "totem_sessions"("totem_id");

-- CreateIndex
CREATE INDEX "totem_organization_subscriptions_totem_id_idx" ON "totem_organization_subscriptions"("totem_id");

-- CreateIndex
CREATE INDEX "totem_organization_subscriptions_organization_id_idx" ON "totem_organization_subscriptions"("organization_id");

-- CreateIndex
CREATE INDEX "totem_event_subscriptions_totem_organization_subscription_i_idx" ON "totem_event_subscriptions"("totem_organization_subscription_id");

-- CreateIndex
CREATE INDEX "totem_event_subscriptions_event_id_idx" ON "totem_event_subscriptions"("event_id");

-- CreateIndex
CREATE INDEX "people_organization_id_idx" ON "people"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "people_email_organization_id_key" ON "people"("email", "organization_id");

-- CreateIndex
CREATE INDEX "person_faces_person_id_idx" ON "person_faces"("person_id");

-- CreateIndex
CREATE INDEX "event_participants_person_id_idx" ON "event_participants"("person_id");

-- CreateIndex
CREATE INDEX "event_participants_event_id_idx" ON "event_participants"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_participants_person_id_event_id_key" ON "event_participants"("person_id", "event_id");

-- CreateIndex
CREATE INDEX "check_ins_event_participant_id_idx" ON "check_ins"("event_participant_id");

-- CreateIndex
CREATE INDEX "check_ins_totem_event_subscription_id_idx" ON "check_ins"("totem_event_subscription_id");

-- CreateIndex
CREATE INDEX "audit_logs_session_id_idx" ON "audit_logs"("session_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_idx" ON "audit_logs"("organization_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_event_id_idx" ON "audit_logs"("event_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "features_code_key" ON "features"("code");

-- CreateIndex
CREATE INDEX "plan_features_feature_id_idx" ON "plan_features"("feature_id");

-- CreateIndex
CREATE INDEX "plan_features_plan_id_idx" ON "plan_features"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_features_feature_id_plan_id_key" ON "plan_features"("feature_id", "plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_organization_id_key" ON "subscriptions"("organization_id");

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "plan_change_requests_organization_id_idx" ON "plan_change_requests"("organization_id");

-- CreateIndex
CREATE INDEX "plan_change_requests_current_plan_id_idx" ON "plan_change_requests"("current_plan_id");

-- CreateIndex
CREATE INDEX "plan_change_requests_requested_plan_id_idx" ON "plan_change_requests"("requested_plan_id");

-- CreateIndex
CREATE INDEX "plan_change_requests_resolved_by_id_idx" ON "plan_change_requests"("resolved_by_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_print_config_id_fkey" FOREIGN KEY ("print_config_id") REFERENCES "print_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "totem_sessions" ADD CONSTRAINT "totem_sessions_totem_id_fkey" FOREIGN KEY ("totem_id") REFERENCES "totems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "totem_organization_subscriptions" ADD CONSTRAINT "totem_organization_subscriptions_totem_id_fkey" FOREIGN KEY ("totem_id") REFERENCES "totems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "totem_organization_subscriptions" ADD CONSTRAINT "totem_organization_subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "totem_event_subscriptions" ADD CONSTRAINT "totem_event_subscriptions_totem_organization_subscription__fkey" FOREIGN KEY ("totem_organization_subscription_id") REFERENCES "totem_organization_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "totem_event_subscriptions" ADD CONSTRAINT "totem_event_subscriptions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_faces" ADD CONSTRAINT "person_faces_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_event_participant_id_fkey" FOREIGN KEY ("event_participant_id") REFERENCES "event_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_totem_event_subscription_id_fkey" FOREIGN KEY ("totem_event_subscription_id") REFERENCES "totem_event_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_change_requests" ADD CONSTRAINT "plan_change_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_change_requests" ADD CONSTRAINT "plan_change_requests_current_plan_id_fkey" FOREIGN KEY ("current_plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_change_requests" ADD CONSTRAINT "plan_change_requests_requested_plan_id_fkey" FOREIGN KEY ("requested_plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_change_requests" ADD CONSTRAINT "plan_change_requests_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
