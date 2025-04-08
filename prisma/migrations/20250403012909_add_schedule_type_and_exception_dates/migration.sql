/*
  Warnings:

  - Added the required column `type` to the `BusinessAvailableTime` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('WEEKLY', 'EXCEPTION');

-- AlterTable
ALTER TABLE "BusinessAvailableTime" ADD COLUMN     "date" TIMESTAMP(3),
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "type" "ScheduleType" NOT NULL,
ALTER COLUMN "day_of_week" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "BusinessAvailableTime_business_id_service_id_type_day_of_we_idx" ON "BusinessAvailableTime"("business_id", "service_id", "type", "day_of_week");

-- CreateIndex
CREATE INDEX "BusinessAvailableTime_business_id_service_id_type_date_idx" ON "BusinessAvailableTime"("business_id", "service_id", "type", "date");
