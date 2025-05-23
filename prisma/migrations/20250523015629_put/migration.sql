-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "payment_id" UUID;

-- CreateTable
CREATE TABLE "payments" (
    "payment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "service_id" UUID,
    "business_id" UUID,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentKey" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "metadata" JSONB,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("service_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
