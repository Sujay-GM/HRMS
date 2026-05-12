-- Migration: 20240002_add_theme_column
-- Adds theme column to companies table

ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "theme" VARCHAR(1000);
