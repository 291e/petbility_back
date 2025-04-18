/*
  Warnings:

  - You are about to drop the column `order_id` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `payment_key` on the `payments` table. All the data in the column will be lost.
  - Added the required column `orderId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "payments_order_id_idx";

-- DropIndex
DROP INDEX "payments_payment_key_idx";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "order_id",
DROP COLUMN "payment_key",
ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "paymentKey" TEXT;

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_paymentKey_idx" ON "payments"("paymentKey");
