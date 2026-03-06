/*
  Warnings:

  - A unique constraint covering the columns `[access_token]` on the table `totems` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "totems" ADD COLUMN     "access_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "totems_access_token_key" ON "totems"("access_token");
