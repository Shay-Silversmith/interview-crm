-- =============================================================================
-- InterviewFlow — 0006_activity_triggers.sql
-- Automatic recent_activity logging via AFTER triggers on source tables.
--
-- Design notes
-- ────────────
-- • SECURITY INVOKER (not DEFINER) — trigger functions run with the privileges
--   of the authenticated user who fired the statement.  Because every source
--   table already enforces user_id = auth.uid() via RLS, NEW.user_id always
--   equals auth.uid().  The recent_activity INSERT policy (WITH CHECK
--   auth.uid() = user_id) therefore passes without needing to bypass RLS.
--
-- • Helper function log_recent_activity() centralises the INSERT so each
--   trigger function stays a thin shim.  The helper's parameter names use
--   p_related_entity_* to stay readable at call sites; they map to the table's
--   entity_type / entity_id columns.
--
-- • WHEN clauses on triggers 2 and 4 avoid calling the plpgsql function on
--   every update — the executor short-circuits before entering the function
--   if the condition is false.  Trigger 3 uses a WHEN clause for the same
--   reason.
--
-- • activity_type cast — values must match the activity_type enum defined in
--   0001_init.sql exactly:
--     'application_created' | 'stage_changed' | 'task_completed' |
--     'interview_scheduled' | 'offer_received' | 'note_added' |
--     'document_added'     | 'contact_added'
--
-- • entity_type strings must match what mapRecentActivity() in mappers.ts
--   expects: 'application' → applicationId, 'task' → taskId.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Helper: log_recent_activity
-- Centralises the INSERT so trigger functions are single-line PERFORM calls.
-- Uses CREATE OR REPLACE so repeated `supabase db push` runs are idempotent.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_recent_activity(
  p_user_id             uuid,
  p_activity_type       text,
  p_title               text,
  p_related_entity_type text,
  p_related_entity_id   uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  INSERT INTO recent_activity (
    user_id,
    activity_type,
    entity_type,
    entity_id,
    title
  ) VALUES (
    p_user_id,
    p_activity_type::activity_type,
    p_related_entity_type,
    p_related_entity_id,
    p_title
  );
END;
$$;


-- ===========================================================================
-- Trigger 1 — job_applications INSERT → 'application_created'
-- ===========================================================================
CREATE OR REPLACE FUNCTION trg_fn_application_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  PERFORM log_recent_activity(
    NEW.user_id,
    'application_created',
    format('Applied to %s', NEW.role_name),
    'application',
    NEW.id
  );
  RETURN NULL; -- AFTER trigger; return value is ignored for row triggers
END;
$$;

DROP TRIGGER IF EXISTS trg_application_created ON job_applications;
CREATE TRIGGER trg_application_created
  AFTER INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_application_created();


-- ===========================================================================
-- Trigger 2 — job_applications UPDATE → 'stage_changed'
-- Only fires when the stage column actually changes (WHEN + UPDATE OF guard).
-- ===========================================================================
CREATE OR REPLACE FUNCTION trg_fn_application_stage_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  PERFORM log_recent_activity(
    NEW.user_id,
    'stage_changed',
    format('Moved %s to %s', NEW.role_name, NEW.stage::text),
    'application',
    NEW.id
  );
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_application_stage_changed ON job_applications;
CREATE TRIGGER trg_application_stage_changed
  AFTER UPDATE OF stage ON job_applications
  FOR EACH ROW
  WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
  EXECUTE FUNCTION trg_fn_application_stage_changed();


-- ===========================================================================
-- Trigger 3 — calendar_events INSERT → 'interview_scheduled'
-- Only fires when the new event type is 'Interview'.
-- ===========================================================================
CREATE OR REPLACE FUNCTION trg_fn_interview_scheduled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  PERFORM log_recent_activity(
    NEW.user_id,
    'interview_scheduled',
    format('Interview: %s', NEW.title),
    'calendar_event',
    NEW.id
  );
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_interview_scheduled ON calendar_events;
CREATE TRIGGER trg_interview_scheduled
  AFTER INSERT ON calendar_events
  FOR EACH ROW
  WHEN (NEW.type = 'Interview'::calendar_event_type)
  EXECUTE FUNCTION trg_fn_interview_scheduled();


-- ===========================================================================
-- Trigger 4 — tasks UPDATE → 'task_completed'
-- Only fires when status transitions to 'Done' (not on every task update).
-- ===========================================================================
CREATE OR REPLACE FUNCTION trg_fn_task_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  PERFORM log_recent_activity(
    NEW.user_id,
    'task_completed',
    format('Completed: %s', NEW.title),
    'task',
    NEW.id
  );
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_completed ON tasks;
CREATE TRIGGER trg_task_completed
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Done'::task_status)
  EXECUTE FUNCTION trg_fn_task_completed();
