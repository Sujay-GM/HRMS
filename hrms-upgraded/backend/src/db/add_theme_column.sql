-- Run this migration to add the theme column if it does not already exist
ALTER TABLE companies ADD COLUMN IF NOT EXISTS theme VARCHAR(1000);
