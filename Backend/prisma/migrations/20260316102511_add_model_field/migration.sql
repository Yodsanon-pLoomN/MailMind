/*
  Warnings:

  - You are about to drop the `Attachment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_draftId_fkey";

-- AlterTable
ALTER TABLE "UserSetting" ADD COLUMN     "defaultProvider" TEXT,
ALTER COLUMN "defaultModel" DROP NOT NULL,
ALTER COLUMN "defaultModel" DROP DEFAULT;

-- DropTable
DROP TABLE "Attachment";
