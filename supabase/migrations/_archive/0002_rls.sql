-- =============================================================================
-- InterviewFlow — 0002_rls.sql
-- Row Level Security: enable RLS on every table, add four policies per table
-- All user-owned tables use:  using (auth.uid() = user_id)
-- profiles uses:              using (auth.uid() = id)
-- =============================================================================


-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;

create policy "profiles: select own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on profiles for update
  using  (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: delete own"
  on profiles for delete
  using (auth.uid() = id);


-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------
alter table companies enable row level security;

create policy "companies: select own"
  on companies for select
  using (auth.uid() = user_id);

create policy "companies: insert own"
  on companies for insert
  with check (auth.uid() = user_id);

create policy "companies: update own"
  on companies for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "companies: delete own"
  on companies for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- cv_versions
-- ---------------------------------------------------------------------------
alter table cv_versions enable row level security;

create policy "cv_versions: select own"
  on cv_versions for select
  using (auth.uid() = user_id);

create policy "cv_versions: insert own"
  on cv_versions for insert
  with check (auth.uid() = user_id);

create policy "cv_versions: update own"
  on cv_versions for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "cv_versions: delete own"
  on cv_versions for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- job_applications
-- ---------------------------------------------------------------------------
alter table job_applications enable row level security;

create policy "job_applications: select own"
  on job_applications for select
  using (auth.uid() = user_id);

create policy "job_applications: insert own"
  on job_applications for insert
  with check (auth.uid() = user_id);

create policy "job_applications: update own"
  on job_applications for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "job_applications: delete own"
  on job_applications for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- interview_stages
-- ---------------------------------------------------------------------------
alter table interview_stages enable row level security;

create policy "interview_stages: select own"
  on interview_stages for select
  using (auth.uid() = user_id);

create policy "interview_stages: insert own"
  on interview_stages for insert
  with check (auth.uid() = user_id);

create policy "interview_stages: update own"
  on interview_stages for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "interview_stages: delete own"
  on interview_stages for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
alter table tasks enable row level security;

create policy "tasks: select own"
  on tasks for select
  using (auth.uid() = user_id);

create policy "tasks: insert own"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "tasks: update own"
  on tasks for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tasks: delete own"
  on tasks for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------------
alter table contacts enable row level security;

create policy "contacts: select own"
  on contacts for select
  using (auth.uid() = user_id);

create policy "contacts: insert own"
  on contacts for insert
  with check (auth.uid() = user_id);

create policy "contacts: update own"
  on contacts for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "contacts: delete own"
  on contacts for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- calendar_events
-- ---------------------------------------------------------------------------
alter table calendar_events enable row level security;

create policy "calendar_events: select own"
  on calendar_events for select
  using (auth.uid() = user_id);

create policy "calendar_events: insert own"
  on calendar_events for insert
  with check (auth.uid() = user_id);

create policy "calendar_events: update own"
  on calendar_events for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "calendar_events: delete own"
  on calendar_events for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
alter table documents enable row level security;

create policy "documents: select own"
  on documents for select
  using (auth.uid() = user_id);

create policy "documents: insert own"
  on documents for insert
  with check (auth.uid() = user_id);

create policy "documents: update own"
  on documents for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "documents: delete own"
  on documents for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- prepared_answers
-- ---------------------------------------------------------------------------
alter table prepared_answers enable row level security;

create policy "prepared_answers: select own"
  on prepared_answers for select
  using (auth.uid() = user_id);

create policy "prepared_answers: insert own"
  on prepared_answers for insert
  with check (auth.uid() = user_id);

create policy "prepared_answers: update own"
  on prepared_answers for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "prepared_answers: delete own"
  on prepared_answers for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- ai_summaries
-- ---------------------------------------------------------------------------
alter table ai_summaries enable row level security;

create policy "ai_summaries: select own"
  on ai_summaries for select
  using (auth.uid() = user_id);

create policy "ai_summaries: insert own"
  on ai_summaries for insert
  with check (auth.uid() = user_id);

create policy "ai_summaries: update own"
  on ai_summaries for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "ai_summaries: delete own"
  on ai_summaries for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- recent_activity
-- ---------------------------------------------------------------------------
alter table recent_activity enable row level security;

create policy "recent_activity: select own"
  on recent_activity for select
  using (auth.uid() = user_id);

create policy "recent_activity: insert own"
  on recent_activity for insert
  with check (auth.uid() = user_id);

create policy "recent_activity: update own"
  on recent_activity for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "recent_activity: delete own"
  on recent_activity for delete
  using (auth.uid() = user_id);
