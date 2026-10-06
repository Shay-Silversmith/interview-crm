-- ---------------------------------------------------------------------------
-- 0006_documents_bucket_file_types.sql
--
-- Lets the 'documents' bucket hold the files that actually come with a hiring
-- process, not only letters.
--
-- The bucket accepted PDF, Word and two image types. A take-home assignment
-- arrives as a zip, and its submission is as often slides or a spreadsheet as
-- a document, so the one thing worth keeping beside an application was the one
-- thing that could not be uploaded.
--
-- Both zip types are listed because browsers disagree: Windows reports
-- application/x-zip-compressed, most others application/zip.
--
-- The size limit is unchanged at 10 MB. 'cv-files' is untouched — a CV is
-- still a PDF, and the CV parser reads nothing else.
--
-- Idempotent: an UPDATE to a fixed list, safe to re-run.
-- ---------------------------------------------------------------------------

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'text/markdown',
  'image/png',
  'image/jpeg'
]
where id = 'documents';
