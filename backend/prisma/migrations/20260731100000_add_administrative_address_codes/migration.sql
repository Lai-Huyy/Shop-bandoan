-- Store canonical new-administration-area codes and names while retaining legacy text columns.
ALTER TABLE "user_addresses"
  ADD COLUMN "province_code" VARCHAR(10),
  ADD COLUMN "province_name" VARCHAR(100),
  ADD COLUMN "ward_code" VARCHAR(10),
  ADD COLUMN "ward_name" VARCHAR(100);

ALTER TABLE "orders"
  ADD COLUMN "shipping_province_code" VARCHAR(10),
  ADD COLUMN "shipping_province_name" VARCHAR(100),
  ADD COLUMN "shipping_ward_code" VARCHAR(10),
  ADD COLUMN "shipping_ward_name" VARCHAR(100);
