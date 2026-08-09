ALTER TABLE "orders"
  ADD COLUMN "shipping_recipient_name" VARCHAR(100),
  ADD COLUMN "shipping_recipient_phone" VARCHAR(20),
  ADD COLUMN "shipping_street_address" TEXT,
  ADD COLUMN "shipping_ward" VARCHAR(100),
  ADD COLUMN "shipping_district" VARCHAR(100),
  ADD COLUMN "shipping_city" VARCHAR(100);
