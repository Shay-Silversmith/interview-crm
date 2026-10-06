-- ---------------------------------------------------------------------------
-- 0007_documents_stage_link.sql
--
-- Lets a document be attached to one interview round.
--
-- A round often has files of its own — the brief for a test, the submission,
-- the slides presented — and until now a document could only be linked to an
-- application as a whole, so the file for a round sat in a list with nothing
-- to say which round it was for.
--
-- Nullable: most documents belong to no round. ON DELETE SET NULL, not
-- CASCADE: deleting a round should not take the candidate's submitted work
-- with it; the file stays under the application.
--
-- Idempotent.
-- ---------------------------------------------------------------------------

alter table documents
  add column if not exists stage_id uuid references interview_stages(id) on delete set null;

create index if not exists documents_stage_id_idx on documents(stage_id);

-- PostgREST caches the schema; without this the API keeps answering
-- "could not find the 'stage_id' column" until its next reload.
notify pgrst, 'reload schema';
