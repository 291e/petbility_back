/*
  Warnings:

  - Added the required column `title` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('RESERVATION_CREATED', 'RESERVATION_UPDATED', 'RESERVATION_CANCELED', 'RESERVATION_ACCEPTED', 'RESERVATION_REJECTED', 'RESERVATION_COMPLETED', 'RESERVATION_REMINDER', 'REVIEW_REQUESTED', 'REVIEW_RECEIVED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'SYSTEM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReservationStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "ReservationStatus" ADD VALUE 'REJECTED';
ALTER TYPE "ReservationStatus" ADD VALUE 'NO_SHOW';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");
