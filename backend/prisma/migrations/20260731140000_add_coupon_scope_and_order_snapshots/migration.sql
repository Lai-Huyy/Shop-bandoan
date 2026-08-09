ALTER TABLE "coupons"
  ADD COLUMN "category_id" INTEGER;

ALTER TABLE "coupons"
  ADD CONSTRAINT "coupons_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "coupons_category_id_idx" ON "coupons"("category_id");

ALTER TABLE "orders"
  ADD COLUMN "coupon_code_snapshot" VARCHAR(50),
  ADD COLUMN "coupon_discount_type_snapshot" "DiscountType",
  ADD COLUMN "coupon_discount_value_snapshot" DECIMAL(12, 2),
  ADD COLUMN "coupon_applied_unit_price" DECIMAL(12, 2);
