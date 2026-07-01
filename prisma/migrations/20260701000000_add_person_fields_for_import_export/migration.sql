-- Add new fields to Person model
ALTER TABLE "people" ADD COLUMN "job_title" TEXT;
ALTER TABLE "people" ADD COLUMN "department" TEXT;
ALTER TABLE "people" ADD COLUMN "birth_date" TIMESTAMPTZ;
ALTER TABLE "people" ADD COLUMN "notes" TEXT;

-- Add unique constraint on document + organization_id
CREATE UNIQUE INDEX "people_document_organization_id_key" ON "people"("document", "organization_id");
