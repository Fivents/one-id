/*
  Warnings:

  - You are about to drop the column `access_token` on the `totems` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "totems_access_token_key";

-- AlterTable
ALTER TABLE "totems" DROP COLUMN "access_token";
