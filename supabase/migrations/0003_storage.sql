-- =============================================================================
-- InterviewFlow — 0003_storage.sql
-- Storage: create private buckets, attach owner-only RLS policies
-- Bucket path convention: {user_id}/{filename}
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Buckets
-- ---------------------------------------------------------------------------

-- cv-files: user CV PDF uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cv-files',
  'cv-files',
  false,                          -- private: access only via signed URLs
  5242880,                        -- 5 MB limit
  array['application/pdf']
)
on conflict (id) do nothing;


-- documents: cover letters, transcripts, portfolios, certs
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,                          -- private
  10485760,                       -- 10 MB limit
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do nothing;


-- ---------------------------------------------------------------------------
-- Storage policies: cv-files
-- Path convention: {user_id}/{filename}
-- ---------------------------------------------------------------------------

create policy "cv-files: owner can select"
  on storage.objects for select
  using (
    bucket_id = 'cv-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "cv-files: owner can insert"
  on storage.objects for insert
  with check (
    bucket_id = 'cv-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "cv-files: owner can update"
  on storage.objects for update
  using (
    bucket_id = 'cv-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'cv-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "cv-files: owner can delete"
  on storage.objects for delete
  using (
    bucket_id = 'cv-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- ---------------------------------------------------------------------------
-- Storage policies: documents
-- ---------------------------------------------------------------------------

create policy "documents: owner can select"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "documents: owner can insert"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "documents: owner can update"
  on storage.objects for update
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "documents: owner can delete"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
