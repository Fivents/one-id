-- Per-gate sector / ticket-type restriction.
--
-- On the totem-EVENT subscription, not on the totem: a totem serves different events over time
-- and sectors belong to an event, so a device-level rule would leak across events and start
-- rejecting the wrong people as soon as the totem is reassigned.
--
-- NULL means "accept everything", so every existing assignment is unaffected.

ALTER TABLE "totem_event_subscriptions"
  ADD COLUMN IF NOT EXISTS "allowed_sectors" JSONB,
  ADD COLUMN IF NOT EXISTS "allowed_ticket_types" JSONB;
