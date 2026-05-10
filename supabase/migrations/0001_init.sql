-- =============================================================================
-- InterviewFlow — 0001_init.sql
-- Base schema: extensions, enum types, tables, trigger, indexes
-- Run order: this file first, then 0002_rls.sql, then 0003_storage.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- for future full-text search on notes/JDs


-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

create type application_stage as enum (
  'Interested',
  'Applied',
  'HR Screen',
  'Home Assignment',
  'Technical Interview',
  'Manager Interview',
  'Final Interview',
  'Offer',
  'Negotiating',
  'Rejected',
  'Withdrawn'
);

create type priority_level as enum (
  'Critical',
  'High',
  'Medium',
  'Low'
);

create type task_status as enum (
  'Todo',
  'In Progress',
  'Done',
  'Cancelled'
);

create type task_category as enum (
  'Preparation',
  'Follow-up',
  'Application',
  'Assignment',
  'Research',
  'Admin'
);

create type work_model as enum (
  'Remote',
  'Hybrid',
  'On-site'
);

create type company_size as enum (
  '1-50',
  '51-200',
  '201-500',
  '501-2000',
  '2001-10000',
  '10000+'
);

create type contact_type as enum (
  'Recruiter',
  'Hiring Manager',
  'HR',
  'Interviewer',
  'Referral',
  'Employee',
  'Other'
);

create type interview_type as enum (
  'Phone Screen',
  'HR Interview',
  'Technical',
  'System Design',
  'Home Assignment',
  'Manager Interview',
  'Final Interview',
  'Behavioral',
  'Case Study'
);

create type interview_outcome as enum (
  'Passed',
  'Failed',
  'Pending',
  'Cancelled'
);

create type calendar_event_type as enum (
  'Interview',
  'Assignment Deadline',
  'Application Deadline',
  'Follow-up Reminder',
  'Preparation Session',
  'General Task',
  'Reminder',
  'Other'
);

create type document_type as enum (
  'CV',
  'Cover Letter',
  'Home Assignment',
  'Transcript',
  'Certificate',
  'Portfolio',
  'Reference',
  'Other'
);

create type prep_category as enum (
  'Personal Pitch',
  'Behavioral',
  'STAR',
  'HR',
  'Technical',
  'Product Sense',
  'System Design',
  'Case Study',
  'Leadership Principles',
  'Research'
);

create type confidence_level as enum (
  'Low',
  'Medium',
  'High'
);

create type ai_tool_type as enum (
  'Company Summary',
  'JD Parser',
  'Prepare Me',
  'Interview Summary',
  'Follow-up Message',
  'Personalized Answer'
);

create type activity_type as enum (
  'application_created',
  'stage_changed',
  'task_completed',
  'interview_scheduled',
  'offer_received',
  'note_added',
  'document_added',
  'contact_added'
);


-- ---------------------------------------------------------------------------
-- updated_at trigger (single function, reused on every table)
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- profiles: one row per auth user, id = auth.users.id
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  email       text,
  university  text,
  year_of_study integer,
  military_unit text,
  headline    text,
  bio         text,
  skills      text[] not null default '{}',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table profiles is 'Public profile info for each InterviewFlow user. id = auth.users.id.';

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();


-- companies: companies the user is tracking
create table companies (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  industry         text,
  size             company_size,
  location         text,
  website          text,
  linkedin_url     text,
  description      text,
  notes            text,
  glassdoor_rating numeric(3,1) check (glassdoor_rating between 0 and 5),
  glassdoor_url    text,
  tech_stack       text[] not null default '{}',
  logo_url         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table companies is 'Companies the user is targeting or has applied to.';

create trigger trg_companies_updated_at
  before update on companies
  for each row execute function set_updated_at();


-- cv_versions: CV variants tailored to different role types
create table cv_versions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  company_id           uuid references companies(id) on delete set null,
  name                 text not null,                        -- e.g. "Data-heavy v2.1"
  version_number       integer not null default 1,
  emphasis             text,                                 -- short description of focus
  skills_highlighted   text[] not null default '{}',
  projects_highlighted text[] not null default '{}',
  file_name            text,
  file_size            integer,
  storage_path         text,                                 -- path in cv-files bucket
  notes                text,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
comment on table cv_versions is 'CV variants: each row is a tailored resume version with metadata about its focus.';

create trigger trg_cv_versions_updated_at
  before update on cv_versions
  for each row execute function set_updated_at();


-- job_applications: the core pipeline entity
create table job_applications (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  company_id             uuid not null references companies(id) on delete restrict,
  company_name           text not null,                      -- denormalized for quick display
  role_name              text not null,
  role_url               text,
  job_description        text,
  stage                  application_stage not null default 'Interested',
  priority               priority_level not null default 'Medium',
  work_model             work_model,
  location               text,
  salary_min             integer,
  salary_max             integer,
  currency               text default 'ILS',
  fit_score              integer check (fit_score between 0 and 100),
  urgency_score          integer check (urgency_score between 0 and 100),
  why_interesting        text,
  what_to_emphasize      text,
  notes                  text,
  submitted_cv_version_id uuid references cv_versions(id) on delete set null,
  submitted_cv_name      text,                               -- denormalized for display
  applied_at             timestamptz,
  deadline_at            timestamptz,
  next_event_at          timestamptz,
  next_event_description text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
comment on table job_applications is 'A job application in the pipeline. Central entity — most other tables link back to this.';

create trigger trg_job_applications_updated_at
  before update on job_applications
  for each row execute function set_updated_at();


-- interview_stages: one row per interview round within an application
create table interview_stages (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  application_id    uuid not null references job_applications(id) on delete cascade,
  type              interview_type not null,
  stage_order       integer not null default 0,              -- display ordering
  scheduled_at      timestamptz,
  completed_at      timestamptz,
  duration_minutes  integer,
  interviewer       text,
  interviewer_title text,
  location          text,                                    -- zoom link / office address
  outcome           interview_outcome not null default 'Pending',
  notes             text,
  feedback_received text,
  next_steps        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table interview_stages is 'Individual interview rounds: phone screen, technical, HR, etc.';

create trigger trg_interview_stages_updated_at
  before update on interview_stages
  for each row execute function set_updated_at();


-- tasks: action items linked to applications, companies, or standalone
create table tasks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  application_id uuid references job_applications(id) on delete set null,
  company_id     uuid references companies(id) on delete set null,
  company_name   text,                                       -- denormalized
  title          text not null,
  description    text,
  category       task_category not null,
  status         task_status not null default 'Todo',
  priority       priority_level not null default 'Medium',
  due_at         timestamptz,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table tasks is 'Action items: prep sessions, follow-ups, deadlines, research tasks.';

create trigger trg_tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();


-- contacts: people at target companies
create table contacts (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  company_id           uuid references companies(id) on delete set null,
  application_id       uuid references job_applications(id) on delete set null,
  name                 text not null,
  title                text,
  company_name         text,                                 -- denormalized
  email                text,
  linkedin_url         text,
  type                 contact_type not null,
  notes                text,
  last_interaction_at  timestamptz,
  follow_up_due_at     timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
comment on table contacts is 'Recruiters, hiring managers, referrals, and other people in the network.';

create trigger trg_contacts_updated_at
  before update on contacts
  for each row execute function set_updated_at();


-- calendar_events: interviews, deadlines, reminders
create table calendar_events (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  application_id     uuid references job_applications(id) on delete set null,
  contact_id         uuid references contacts(id) on delete set null,
  title              text not null,
  type               calendar_event_type not null,
  company_name       text,                                   -- denormalized
  application_name   text,                                   -- denormalized
  starts_at          timestamptz not null,
  ends_at            timestamptz,
  all_day            boolean not null default false,
  location           text,
  meeting_url        text,
  description        text,
  reminder_minutes   integer,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
comment on table calendar_events is 'Calendar entries: interviews, assignment deadlines, follow-up reminders, prep sessions.';

create trigger trg_calendar_events_updated_at
  before update on calendar_events
  for each row execute function set_updated_at();


-- documents: cover letters, transcripts, portfolios, certificates
create table documents (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  application_id uuid references job_applications(id) on delete set null,
  name           text not null,
  type           document_type not null,
  file_name      text,
  file_size      integer,
  storage_path   text,                                       -- path in documents bucket
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table documents is 'Supporting documents: cover letters, transcripts, portfolios, certificates.';

create trigger trg_documents_updated_at
  before update on documents
  for each row execute function set_updated_at();


-- prepared_answers: interview Q&A library with STAR structure
create table prepared_answers (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  application_id    uuid references job_applications(id) on delete set null,
  question          text not null,
  category          prep_category not null,
  answer            text,
  star_situation    text,
  star_task         text,
  star_action       text,
  star_result       text,
  tags              text[] not null default '{}',
  confidence        integer check (confidence between 1 and 5),
  is_ready          boolean not null default false,
  times_practiced   integer not null default 0,
  last_practiced_at timestamptz,
  last_updated_at   timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table prepared_answers is 'Interview prep Q&A: personal pitch, behavioral STAR stories, technical answers.';

create trigger trg_prepared_answers_updated_at
  before update on prepared_answers
  for each row execute function set_updated_at();


-- ai_summaries: outputs from AI tools (polymorphic via entity_type + entity_id)
create table ai_summaries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  tool_type    ai_tool_type not null,
  entity_type  text not null,                                -- 'application' | 'company' | 'contact' | 'answer'
  entity_id    uuid,                                         -- no FK — polymorphic
  input_data   jsonb not null default '{}',
  output_data  jsonb not null default '{}',
  is_mocked    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table ai_summaries is 'AI-generated outputs from the six InterviewFlow AI tools. Polymorphic entity reference.';

create trigger trg_ai_summaries_updated_at
  before update on ai_summaries
  for each row execute function set_updated_at();


-- recent_activity: append-only event log (updated_at included for schema consistency)
create table recent_activity (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  activity_type activity_type not null,
  entity_type   text not null,                               -- 'application' | 'task' | 'contact' | etc.
  entity_id     uuid,
  title         text not null,
  description   text,
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table recent_activity is 'Append-only activity log for the dashboard feed.';

create trigger trg_recent_activity_updated_at
  before update on recent_activity
  for each row execute function set_updated_at();


-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- profiles
create index idx_profiles_user_id on profiles(user_id);

-- companies
create index idx_companies_user_id on companies(user_id);
create index idx_companies_user_id_created on companies(user_id, created_at desc);
create index idx_companies_name_trgm on companies using gin(name gin_trgm_ops);

-- cv_versions
create index idx_cv_versions_user_id on cv_versions(user_id);
create index idx_cv_versions_user_created on cv_versions(user_id, created_at desc);

-- job_applications
create index idx_applications_user_id on job_applications(user_id);
create index idx_applications_user_created on job_applications(user_id, created_at desc);
create index idx_applications_user_stage on job_applications(user_id, stage);
create index idx_applications_company_id on job_applications(company_id);
create index idx_applications_next_event on job_applications(user_id, next_event_at)
  where next_event_at is not null;

-- interview_stages
create index idx_interview_stages_user_id on interview_stages(user_id);
create index idx_interview_stages_application_id on interview_stages(application_id);
create index idx_interview_stages_scheduled on interview_stages(user_id, scheduled_at)
  where scheduled_at is not null;

-- tasks
create index idx_tasks_user_id on tasks(user_id);
create index idx_tasks_user_due on tasks(user_id, due_at)
  where due_at is not null and status not in ('Done', 'Cancelled');
create index idx_tasks_application_id on tasks(application_id)
  where application_id is not null;
create index idx_tasks_user_status on tasks(user_id, status);

-- contacts
create index idx_contacts_user_id on contacts(user_id);
create index idx_contacts_user_created on contacts(user_id, created_at desc);
create index idx_contacts_company_id on contacts(company_id)
  where company_id is not null;
create index idx_contacts_application_id on contacts(application_id)
  where application_id is not null;

-- calendar_events
create index idx_calendar_events_user_id on calendar_events(user_id);
create index idx_calendar_events_user_starts on calendar_events(user_id, starts_at);
create index idx_calendar_events_application_id on calendar_events(application_id)
  where application_id is not null;

-- documents
create index idx_documents_user_id on documents(user_id);
create index idx_documents_user_created on documents(user_id, created_at desc);
create index idx_documents_application_id on documents(application_id)
  where application_id is not null;

-- prepared_answers
create index idx_prepared_answers_user_id on prepared_answers(user_id);
create index idx_prepared_answers_user_category on prepared_answers(user_id, category);
create index idx_prepared_answers_application_id on prepared_answers(application_id)
  where application_id is not null;

-- ai_summaries
create index idx_ai_summaries_user_id on ai_summaries(user_id);
create index idx_ai_summaries_user_created on ai_summaries(user_id, created_at desc);
create index idx_ai_summaries_entity on ai_summaries(entity_type, entity_id)
  where entity_id is not null;

-- recent_activity
create index idx_recent_activity_user_id on recent_activity(user_id);
create index idx_recent_activity_user_created on recent_activity(user_id, created_at desc);
