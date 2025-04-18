/*
  Warnings:

  - You are about to drop the column `order_name` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `orderer_email` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `orderer_name` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `orderer_phone` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `payment_method` on the `payments` table. All the data in the column will be lost.
  - Added the required column `business_id` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `service_id` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "order_name",
DROP COLUMN "orderer_email",
DROP COLUMN "orderer_name",
DROP COLUMN "orderer_phone",
DROP COLUMN "payment_method",
ADD COLUMN     "business_id" UUID NOT NULL,
ADD COLUMN     "service_id" UUID NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL,
ALTER COLUMN "reservation_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("service_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
