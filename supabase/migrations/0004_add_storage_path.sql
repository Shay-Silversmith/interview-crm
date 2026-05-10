-- ---------------------------------------------------------------------------
-- InterviewFlow — 0004_add_storage_path.sql
-- Adds storage_path column to cv_versions and documents tables.
-- Updates cv-files bucket size limit from 5 MB → 10 MB.
-- ---------------------------------------------------------------------------

-- cv_versions
ALTER TABLE cv_versions
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- documents
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Bump cv-files bucket file_size_limit to 10 MB (10 * 1024 * 1024 bytes)
UPDATE storage.buckets
SET    file_size_limit = 10485760
WHERE  id = 'cv-files';
