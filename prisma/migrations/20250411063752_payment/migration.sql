/*
  Warnings:

  - You are about to drop the column `customer_email` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `customer_mobile_phone` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `customer_name` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "customer_email",
DROP COLUMN "customer_mobile_phone",
DROP COLUMN "customer_name",
ADD COLUMN     "fail_url" TEXT,
ADD COLUMN     "memo" TEXT,
ADD COLUMN     "order_name" TEXT,
ADD COLUMN     "orderer_email" TEXT,
ADD COLUMN     "orderer_name" TEXT,
ADD COLUMN     "orderer_phone" TEXT,
ADD COLUMN     "payment_method" TEXT,
ADD COLUMN     "success_url" TEXT;
