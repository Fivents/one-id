ALTER TABLE "totem_organization_subscriptions"
ADD COLUMN "revoked_at" TIMESTAMP(3),
ADD COLUMN "revoked_reason" TEXT;

ALTER TABLE "totem_event_subscriptions"
ADD COLUMN "revoked_at" TIMESTAMP(3),
ADD COLUMN "revoked_reason" TEXT;
