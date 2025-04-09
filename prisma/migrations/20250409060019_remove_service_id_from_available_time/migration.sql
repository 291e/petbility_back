/*
  Warnings:

  - You are about to drop the column `service_id` on the `BusinessAvailableTime` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "BusinessAvailableTime" DROP CONSTRAINT "BusinessAvailableTime_service_id_fkey";

-- DropIndex
DROP INDEX "BusinessAvailableTime_business_id_service_id_type_date_idx";

-- DropIndex
DROP INDEX "BusinessAvailableTime_business_id_service_id_type_day_of_we_idx";

-- AlterTable
ALTER TABLE "BusinessAvailableTime" DROP COLUMN "service_id";

-- CreateIndex
CREATE INDEX "BusinessAvailableTime_business_id_type_day_of_week_idx" ON "BusinessAvailableTime"("business_id", "type", "day_of_week");

-- CreateIndex
CREATE INDEX "BusinessAvailableTime_business_id_type_date_idx" ON "BusinessAvailableTime"("business_id", "type", "date");
