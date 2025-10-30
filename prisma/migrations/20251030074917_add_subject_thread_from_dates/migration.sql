-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "endDateISO" TEXT,
ADD COLUMN     "from" TEXT,
ADD COLUMN     "startDateISO" TEXT,
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "threadId" TEXT;

-- CreateIndex
CREATE INDEX "emails_threadId_idx" ON "emails"("threadId");
