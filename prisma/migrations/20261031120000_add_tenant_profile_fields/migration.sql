-- Add optional tenant profile data without changing existing tenant records.
DO $$ BEGIN
  CREATE TYPE "BusinessCategory" AS ENUM ('cafe', 'qsr', 'casual_dining', 'cloud_kitchen');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "businessCategory" "BusinessCategory";
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "gstin" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "fssaiLicense" TEXT;
