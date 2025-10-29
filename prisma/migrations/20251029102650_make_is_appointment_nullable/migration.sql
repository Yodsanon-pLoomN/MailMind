-- AlterTable
ALTER TABLE "emails" ALTER COLUMN "isAppointment" DROP NOT NULL,
ALTER COLUMN "isAppointment" DROP DEFAULT;
