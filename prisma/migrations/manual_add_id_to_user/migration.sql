-- First add the id column without constraints
ALTER TABLE "User" ADD COLUMN "id" TEXT;

-- Generate IDs for existing users
UPDATE "User" SET "id" = gen_random_uuid()::TEXT WHERE "id" IS NULL;

-- Make the column non-nullable
ALTER TABLE "User" ALTER COLUMN "id" SET NOT NULL;

-- Add the default constraint for new rows
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::TEXT;

-- Add the primary key constraint
ALTER TABLE "User" ADD CONSTRAINT "User_id_key" UNIQUE ("id");
