/*
  Warnings:

  - Added the required column `service_id` to the `BusinessAvailableTime` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BusinessAvailableTime" ADD COLUMN     "service_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "BusinessAvailableTime" ADD CONSTRAINT "BusinessAvailableTime_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("service_id") ON DELETE RESTRICT ON UPDATE CASCADE;
