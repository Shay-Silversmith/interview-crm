-- ---------------------------------------------------------------------------
-- 0005_storage_buckets.sql
--
-- Creates the two storage buckets the app uploads to, and the owner-only
-- policies that guard them.
--
-- Neither bucket existed. CVUploadDialog uploads to 'cv-files' and
-- DocumentUploadDialog to 'documents', so every upload failed with "Bucket not
-- found". An archived migration defined them but was never applied to this
-- project; this is that content, made idempotent so it can be re-run safely.
--
-- Path convention: {user_id}/... — the policies read the first path segment and
-- compare it to auth.uid(), so a user can only reach their own files. Both
-- buckets are private; the app serves files through signed URLs.
-- ---------------------------------------------------------------------------

-- Buckets --------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cv-files', 'cv-files', false,
  5242880,                                   -- 5 MB
  array['application/pdf']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents', 'documents', false,
  10485760,                                  -- 10 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do nothing;

-- Policies -------------------------------------------------------------------
-- Dropped first so re-running this file cannot fail on an existing policy.

drop policy if exists "cv-files: owner can select" on storage.objects;
drop policy if exists "cv-files: owner can insert" on storage.objects;
drop policy if exists "cv-files: owner can update" on storage.objects;
drop policy if exists "cv-files: owner can delete" on storage.objects;

create policy "cv-files: owner can select"
  on storage.objects for select
  using (bucket_id = 'cv-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "cv-files: owner can insert"
  on storage.objects for insert
  with check (bucket_id = 'cv-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "cv-files: owner can update"
  on storage.objects for update
  using      (bucket_id = 'cv-files' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'cv-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "cv-files: owner can delete"
  on storage.objects for delete
  using (bucket_id = 'cv-files' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "documents: owner can select" on storage.objects;
drop policy if exists "documents: owner can insert" on storage.objects;
drop policy if exists "documents: owner can update" on storage.objects;
drop policy if exists "documents: owner can delete" on storage.objects;

create policy "documents: owner can select"
  on storage.objects for select
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "documents: owner can insert"
  on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "documents: owner can update"
  on storage.objects for update
  using      (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "documents: owner can delete"
  on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
