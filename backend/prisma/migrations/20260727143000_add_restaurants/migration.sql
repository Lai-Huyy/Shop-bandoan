-- CreateTable
CREATE TABLE "public"."restaurants" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "phone" VARCHAR(20),
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_slug_key" ON "public"."restaurants"("slug");

-- CreateIndex
CREATE INDEX "restaurants_deleted_at_created_at_idx" ON "public"."restaurants"("deleted_at", "created_at");
