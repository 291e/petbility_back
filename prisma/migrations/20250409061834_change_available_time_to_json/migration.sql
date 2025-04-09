/*
  Warnings:

  - You are about to drop the column `schedule` on the `BusinessAvailableTime` table. All the data in the column will be lost.
  - Added the required column `end_time` to the `BusinessAvailableTime` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `BusinessAvailableTime` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `BusinessAvailableTime` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "BusinessAvailableTime_business_id_idx";

-- AlterTable
ALTER TABLE "BusinessAvailableTime" DROP COLUMN "schedule",
ADD COLUMN     "date" TIMESTAMP(3),
ADD COLUMN     "day_of_week" TEXT,
ADD COLUMN     "end_time" TEXT NOT NULL,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "start_time" TEXT NOT NULL,
ADD COLUMN     "type" "ScheduleType" NOT NULL;

-- CreateIndex
CREATE INDEX "BusinessAvailableTime_business_id_type_day_of_week_idx" ON "BusinessAvailableTime"("business_id", "type", "day_of_week");

-- CreateIndex
CREATE INDEX "BusinessAvailableTime_business_id_type_date_idx" ON "BusinessAvailableTime"("business_id", "type", "date");
