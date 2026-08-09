-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN "username" VARCHAR(50);

-- Backfill existing accounts before enforcing the new required unique field.
UPDATE "public"."users"
SET "username" = CONCAT('user_', REPLACE("id"::text, '-', ''))
WHERE "username" IS NULL;

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");
