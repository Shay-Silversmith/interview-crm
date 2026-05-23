-- =============================================================================
-- 0007_company_logo_url.sql
-- Adds an optional logo URL column to the companies table.
-- Idempotent (IF NOT EXISTS). No data backfill in SQL.
-- =============================================================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS logo_url TEXT;
