/*
  Warnings:

  - You are about to drop the column `date` on the `BusinessAvailableTime` table. All the data in the column will be lost.
  - You are about to drop the column `day_of_week` on the `BusinessAvailableTime` table. All the data in the column will be lost.
  - You are about to drop the column `end_time` on the `BusinessAvailableTime` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `BusinessAvailableTime` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `BusinessAvailableTime` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `BusinessAvailableTime` table. All the data in the column will be lost.
  - Added the required column `schedule` to the `BusinessAvailableTime` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "BusinessAvailableTime_business_id_type_date_idx";

-- DropIndex
DROP INDEX "BusinessAvailableTime_business_id_type_day_of_week_idx";

-- AlterTable
ALTER TABLE "BusinessAvailableTime" DROP COLUMN "date",
DROP COLUMN "day_of_week",
DROP COLUMN "end_time",
DROP COLUMN "reason",
DROP COLUMN "start_time",
DROP COLUMN "type",
ADD COLUMN     "schedule" JSONB NOT NULL;

-- CreateIndex
CREATE INDEX "BusinessAvailableTime_business_id_idx" ON "BusinessAvailableTime"("business_id");
