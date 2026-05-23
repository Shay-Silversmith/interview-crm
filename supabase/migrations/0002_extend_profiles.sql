-- =============================================================================
-- 0002_extend_profiles.sql
-- Adds display_name to profiles for friend-beta multi-user.
-- Idempotent: safe to re-run.
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name text;

-- Backfill: existing rows with NULL/empty display_name get a sensible default
-- from name → email-prefix in that order.
UPDATE profiles
SET    display_name = COALESCE(NULLIF(TRIM(name), ''), split_part(email, '@', 1))
WHERE  display_name IS NULL OR TRIM(display_name) = '';
