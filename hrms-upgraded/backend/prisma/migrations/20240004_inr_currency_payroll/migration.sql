-- Migration: INR currency support + enhanced payroll fields
-- Safe to run on existing databases

-- 1. Add currency column to companies (default INR)
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) NOT NULL DEFAULT 'INR';

-- 2. Update employees: change default currency from USD to INR
ALTER TABLE "employees" ALTER COLUMN "currency" SET DEFAULT 'INR';

-- 3. Update existing employees that have USD to INR (optional — only if you want to bulk-migrate)
-- Uncomment the line below ONLY if all your existing employees should use INR:
-- UPDATE "employees" SET "currency" = 'INR' WHERE "currency" = 'USD';

-- 4. Add new payroll columns for Indian payroll structure
ALTER TABLE "payroll" ADD COLUMN IF NOT EXISTS "gross_pay" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "payroll" ADD COLUMN IF NOT EXISTS "pf" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "payroll" ADD COLUMN IF NOT EXISTS "esi" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "payroll" ADD COLUMN IF NOT EXISTS "total_deductions" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- 5. Backfill gross_pay and total_deductions for existing payroll records
UPDATE "payroll" SET
  "gross_pay" = "basic" + "hra" + "allowances" + "bonus",
  "total_deductions" = "deductions" + "tax"
WHERE "gross_pay" = 0;
