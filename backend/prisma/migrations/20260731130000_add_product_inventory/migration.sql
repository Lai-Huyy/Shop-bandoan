-- Additive inventory counters. Existing products safely start at zero stock
-- until an administrator records their physical inventory.
ALTER TABLE "products"
  ADD COLUMN "stock_quantity" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "sold_quantity" INTEGER NOT NULL DEFAULT 0;
