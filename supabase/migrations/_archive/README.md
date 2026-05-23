# Archived migrations

These files are **historical reference only**. Do NOT apply them to a fresh
project or the live DB.

## Why they're archived

InterviewFlow's deployed schema (on project `rongqrwahaubbvhajvda`) was created
from the single-file `20260521_initial_schema_idempotent.sql`, now renamed and
promoted to `supabase/migrations/0001_initial_schema.sql` as the canonical
source of truth.

A second migration tree (`0001_init.sql` ... `0007_company_logo_url.sql`) was
written earlier under a different design — it uses **enums** (`activity_type`,
`calendar_event_type`, `task_status`) and different `recent_activity` columns
(`entity_type` / `entity_id` instead of the deployed `type` / `application_id`
/ `task_id`). It was never applied to the deployed database, and applying it
now would conflict with the deployed schema.

The non-idempotent variant `20260521_initial_schema.sql` is also archived
because its idempotent twin (now `0001_initial_schema.sql`) supersedes it.

## What's here

| File | Era | Status |
|---|---|---|
| `0001_init.sql` … `0007_company_logo_url.sql` | First-design, multi-file | Never applied to deployed DB |
| `20260521_initial_schema.sql` | Recovery rebuild, non-idempotent | Superseded by idempotent twin |

## What to use instead

The canonical migration set lives in `supabase/migrations/` (one level up).
See `supabase/README.md` for the apply workflow.
