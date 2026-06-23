-- AlterTable
ALTER TABLE "UserSetting" ADD COLUMN     "endTime" TEXT NOT NULL DEFAULT '17:00',
ADD COLUMN     "startTime" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'asia-bangkok',
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'mr',
ADD COLUMN     "tone" TEXT NOT NULL DEFAULT 'formal',
ADD COLUMN     "workDays" TEXT[] DEFAULT ARRAY['mon', 'tue', 'wed', 'thu', 'fri']::TEXT[];
