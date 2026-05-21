-- =============================================================================
-- InterviewFlow — Initial Schema + Row-Level Security
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query).
--
-- Creates all tables, enforces per-user data isolation via RLS, and adds
-- indexes for common query patterns.
--
-- RULE: Every table has a user_id column that references auth.users(id).
--       RLS policies ensure each authenticated user can only read/write their
--       own rows. No cross-user data leakage is possible.
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- profiles
-- One row per authenticated user. Created automatically on first sign-in
-- by ensureProfile() in profilesService.ts.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT,
  email         TEXT,
  phone         TEXT,
  location      TEXT,
  university    TEXT,
  degree        TEXT,
  year          INT,
  unit          TEXT,
  bio           TEXT,
  linkedin_url  TEXT,
  github_url    TEXT,
  target_roles        TEXT[],
  target_industries   TEXT[],
  skills              TEXT[],
  languages           TEXT[],
  default_pitch       TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  industry        TEXT,
  size            TEXT,
  location        TEXT,
  website         TEXT,
  linkedin_url    TEXT,
  logo_url        TEXT,
  description     TEXT,
  notes           TEXT,
  glassdoor_rating NUMERIC(3,1),
  tech_stack      TEXT[],
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own companies"
  ON companies FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS companies_user_id_idx ON companies(user_id);

-- ---------------------------------------------------------------------------
-- job_applications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_applications (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id            UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name          TEXT NOT NULL,
  company_logo_url      TEXT,
  role_name             TEXT NOT NULL,
  role_url              TEXT,
  job_description       TEXT,
  stage                 TEXT NOT NULL DEFAULT 'Interested',
  priority              TEXT NOT NULL DEFAULT 'Medium',
  work_model            TEXT,
  location              TEXT,
  salary_min            INT,
  salary_max            INT,
  currency              TEXT DEFAULT 'ILS',
  fit_score             INT,
  urgency_score         INT,
  submitted_cv_id       UUID,
  submitted_cv_name     TEXT,
  why_interesting       TEXT,
  what_to_emphasize     TEXT,
  notes                 TEXT,
  applied_at            TIMESTAMPTZ,
  deadline_at           TIMESTAMPTZ,
  next_event_at         TIMESTAMPTZ,
  next_event_description TEXT,
  contact_ids           UUID[],
  task_ids              UUID[],
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own applications"
  ON job_applications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS job_applications_user_id_idx ON job_applications(user_id);

-- ---------------------------------------------------------------------------
-- interview_stages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interview_stages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id   UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type             TEXT NOT NULL,
  scheduled_at     TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  duration         INT,
  interviewer      TEXT,
  interviewer_title TEXT,
  outcome          TEXT,
  notes            TEXT,
  feedback_received TEXT,
  next_steps       TEXT,
  stage_order      INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE interview_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own interview stages"
  ON interview_stages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS interview_stages_application_id_idx ON interview_stages(application_id);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL DEFAULT 'Preparation',
  status          TEXT NOT NULL DEFAULT 'Todo',
  priority        TEXT NOT NULL DEFAULT 'Medium',
  due_at          TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  application_id  UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  application_name TEXT,
  company_name    TEXT,
  contact_id      UUID,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks"
  ON tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);

-- ---------------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  type                TEXT NOT NULL DEFAULT 'Recruiter',
  company             TEXT,
  company_id          UUID REFERENCES companies(id) ON DELETE SET NULL,
  title               TEXT,
  email               TEXT,
  phone               TEXT,
  linkedin_url        TEXT,
  application_ids     UUID[],
  notes               TEXT,
  last_interaction_at TIMESTAMPTZ,
  follow_up_due_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contacts"
  ON contacts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON contacts(user_id);

-- ---------------------------------------------------------------------------
-- calendar_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_events (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  type                TEXT NOT NULL DEFAULT 'Interview',
  start_at            TIMESTAMPTZ NOT NULL,
  end_at              TIMESTAMPTZ,
  all_day             BOOLEAN DEFAULT false,
  application_id      UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  application_name    TEXT,
  company_name        TEXT,
  contact_id          UUID REFERENCES contacts(id) ON DELETE SET NULL,
  description         TEXT,
  location            TEXT,
  meeting_url         TEXT,
  reminder_minutes    INT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own calendar events"
  ON calendar_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS calendar_events_user_id_idx ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS calendar_events_start_at_idx ON calendar_events(user_id, start_at);

-- ---------------------------------------------------------------------------
-- cv_versions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cv_versions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  version              INT NOT NULL DEFAULT 1,
  emphasis             TEXT,
  skills_highlighted   TEXT[],
  projects_highlighted TEXT[],
  file_name            TEXT,
  file_size            INT,
  storage_path         TEXT,
  application_ids      UUID[],
  notes                TEXT,
  is_active            BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cv_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own CV versions"
  ON cv_versions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS cv_versions_user_id_idx ON cv_versions(user_id);

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'CV',
  file_name       TEXT,
  file_size       INT,
  storage_path    TEXT,
  application_ids UUID[],
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own documents"
  ON documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);

-- ---------------------------------------------------------------------------
-- prepared_answers (interview prep)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prepared_answers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id     TEXT,
  question        TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'Behavioral',
  answer          TEXT,
  confidence      INT DEFAULT 3,
  is_ready        BOOLEAN DEFAULT false,
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  application_id  UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE prepared_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own prepared answers"
  ON prepared_answers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS prepared_answers_user_id_idx ON prepared_answers(user_id);

-- ---------------------------------------------------------------------------
-- ai_summaries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_summaries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_type       TEXT NOT NULL DEFAULT 'Company Summary',
  input_data      JSONB DEFAULT '{}',
  output_data     JSONB DEFAULT '{}',
  is_mocked       BOOLEAN DEFAULT false,
  application_id  UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own AI summaries"
  ON ai_summaries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS ai_summaries_user_id_idx ON ai_summaries(user_id);

-- ---------------------------------------------------------------------------
-- recent_activity
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recent_activity (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  application_id  UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  company_name    TEXT,
  task_id         UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE recent_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own activity"
  ON recent_activity FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS recent_activity_user_id_idx ON recent_activity(user_id);
CREATE INDEX IF NOT EXISTS recent_activity_created_at_idx ON recent_activity(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Storage buckets (run separately in Storage dashboard or via CLI)
-- These cannot be created via SQL; use Supabase Dashboard → Storage:
--   Bucket: cv-versions (private)
--   Bucket: docs (private)
-- RLS on storage.objects is handled automatically by Supabase when buckets
-- are set to private and users upload to paths starting with their user ID.
-- ---------------------------------------------------------------------------
