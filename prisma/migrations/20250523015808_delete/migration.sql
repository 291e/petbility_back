/*
  Warnings:

  - You are about to drop the column `payment_id` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_business_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_service_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_payment_id_fkey";

-- AlterTable
ALTER TABLE "reservations" DROP COLUMN "payment_id";

-- DropTable
DROP TABLE "payments";
