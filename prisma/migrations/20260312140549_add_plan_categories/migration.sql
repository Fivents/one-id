-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "category_id" TEXT;

-- CreateTable
CREATE TABLE "plan_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_categories_name_key" ON "plan_categories"("name");

-- CreateIndex
CREATE INDEX "plans_category_id_idx" ON "plans"("category_id");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "plan_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
