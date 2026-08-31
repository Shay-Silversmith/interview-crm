-- ---------------------------------------------------------------------------
-- 0004_add_ai_role_summary.sql
--
-- Adds job_applications.ai_role_summary, where the Role Analysis tool saves its
-- output so the prep pack can reuse it later.
--
-- The client has mapped this column on write (applicationsService.update) and on
-- read (mapApplication) since the tool shipped, but it was never added to the
-- database. Every "Save to application" therefore failed with
-- "column ai_role_summary does not exist", and the analysis was lost.
--
-- Additive and nullable: existing rows are untouched and read back as undefined,
-- exactly as they do today.
-- ---------------------------------------------------------------------------

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS ai_role_summary JSONB;

COMMENT ON COLUMN job_applications.ai_role_summary IS
  'Saved output of the Role Analysis (JD parser) AI tool. Consumed by the prep pack.';
