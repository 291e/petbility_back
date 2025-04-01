/*
  Warnings:

  - You are about to drop the column `date` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the column `available_time` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `avg_rating` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `business_id` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `canceled_count` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `confirmed_count` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `pending_count` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `review_count` on the `services` table. All the data in the column will be lost.
  - Made the column `address` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `reserved_at` to the `reservations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `admin_id` to the `services` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_business_id_fkey";

-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_pet_id_fkey";

-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_service_id_fkey";

-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_user_id_fkey";

-- DropForeignKey
ALTER TABLE "services" DROP CONSTRAINT "services_business_id_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "address" SET NOT NULL;

-- AlterTable
ALTER TABLE "reservations" DROP COLUMN "date",
DROP COLUMN "time",
ADD COLUMN     "reserved_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "services" DROP COLUMN "available_time",
DROP COLUMN "avg_rating",
DROP COLUMN "business_id",
DROP COLUMN "canceled_count",
DROP COLUMN "confirmed_count",
DROP COLUMN "duration",
DROP COLUMN "is_deleted",
DROP COLUMN "latitude",
DROP COLUMN "likes",
DROP COLUMN "location",
DROP COLUMN "longitude",
DROP COLUMN "pending_count",
DROP COLUMN "review_count",
ADD COLUMN     "admin_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "BusinessAvailableTime" (
    "id" TEXT NOT NULL,
    "business_id" UUID NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessAvailableTime_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessAvailableTime" ADD CONSTRAINT "BusinessAvailableTime_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("service_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "Pet"("pet_id") ON DELETE CASCADE ON UPDATE CASCADE;
