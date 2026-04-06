ALTER TABLE "events"
ADD COLUMN "address_details" JSONB;

ALTER TABLE "print_configs"
ADD COLUMN "elements_layout" JSONB;
