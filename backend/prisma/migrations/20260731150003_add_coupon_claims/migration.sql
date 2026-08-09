-- CreateTable
CREATE TABLE "public"."coupon_claims" (
    "id" UUID NOT NULL,
    "coupon_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID,
    "claimed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "coupon_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupon_claims_order_id_key" ON "public"."coupon_claims"("order_id");

-- CreateIndex
CREATE INDEX "coupon_claims_user_id_used_at_claimed_at_idx" ON "public"."coupon_claims"("user_id", "used_at", "claimed_at");

-- CreateIndex
CREATE INDEX "coupon_claims_coupon_id_used_at_idx" ON "public"."coupon_claims"("coupon_id", "used_at");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_claims_coupon_id_user_id_key" ON "public"."coupon_claims"("coupon_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."coupon_claims" ADD CONSTRAINT "coupon_claims_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."coupon_claims" ADD CONSTRAINT "coupon_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."coupon_claims" ADD CONSTRAINT "coupon_claims_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
