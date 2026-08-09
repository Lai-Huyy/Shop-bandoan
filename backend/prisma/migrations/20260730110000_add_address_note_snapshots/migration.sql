-- Preserve optional delivery instructions in the address book and immutable orders.
ALTER TABLE "user_addresses" ADD COLUMN "note" VARCHAR(500);
ALTER TABLE "orders" ADD COLUMN "shipping_address_note" VARCHAR(500);
