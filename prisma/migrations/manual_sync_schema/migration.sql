-- Add missing columns to the User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP;

-- Generate IDs for existing users if the id column was just added
UPDATE "User" SET "id" = gen_random_uuid()::TEXT WHERE "id" IS NULL;

-- Make the id column non-nullable
ALTER TABLE "User" ALTER COLUMN "id" SET NOT NULL;

-- Add the default constraint for new rows
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::TEXT;

-- Add the primary key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'User_pkey'
    ) THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_id_key" PRIMARY KEY ("id");
    END IF;
END $$;
