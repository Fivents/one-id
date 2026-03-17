-- Make check-ins support APP/manual source without totem binding
ALTER TABLE "check_ins" DROP CONSTRAINT "check_ins_totem_event_subscription_id_fkey";

ALTER TABLE "check_ins"
  ALTER COLUMN "totem_event_subscription_id" DROP NOT NULL;

ALTER TABLE "check_ins"
  ADD CONSTRAINT "check_ins_totem_event_subscription_id_fkey"
  FOREIGN KEY ("totem_event_subscription_id")
  REFERENCES "totem_event_subscriptions"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
