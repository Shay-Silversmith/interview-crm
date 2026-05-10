-- ---------------------------------------------------------------------------
-- InterviewFlow — 0005_add_ai_role_summary.sql
--
-- Adds the ai_role_summary column that applicationsService.update() writes
-- to conditionally (when data.aiRoleSummary !== undefined) and that
-- JDParserPanel.handleMasterSave() populates after a JD parse.
--
-- Without this column PostgREST returns HTTP 400 on every JD Parser "Save"
-- in Supabase mode. The column was present in the ApplicationRow mapper and
-- the update() service but was missing from the schema.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS is safe to run multiple times.
-- ---------------------------------------------------------------------------

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS ai_role_summary JSONB;
