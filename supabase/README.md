# InterviewFlow Supabase

## Migrations

The canonical schema lives in `supabase/migrations/` as numbered files:

```
0001_initial_schema.sql   — tables + RLS for every table (idempotent)
0002_…                     — added by future prompts
```

Apply all migrations to a fresh project via the Management API helper:

```bash
for f in supabase/migrations/0*.sql; do
  npm run sb:sql -- --file "$f"
done
```

Each migration must be **idempotent** — use `CREATE TABLE IF NOT EXISTS`,
`DROP POLICY IF EXISTS` then `CREATE POLICY`, `ALTER TABLE ADD COLUMN IF NOT
EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS` then `CREATE
TRIGGER` — so reruns are safe.

### Adding a new migration

1. Write `supabase/migrations/NNNN_<short_name>.sql` (next number).
2. Apply: `npm run sb:sql -- --file supabase/migrations/NNNN_<short_name>.sql`
3. Verify with a follow-up SELECT (e.g. `information_schema.columns` for new
   columns; `pg_trigger` for new triggers).

## Archive

`supabase/migrations/_archive/` holds an earlier, never-deployed migration
tree and the non-idempotent twin of the original schema file. Read its
`README.md` before touching anything in there.

## Helpers

| Command | Purpose |
|---|---|
| `npm run sb:sql -- "SELECT …"` | Run ad-hoc SQL on the project DB via Management API |
| `npm run sb:sql -- --file path` | Apply a `.sql` file |
| `npm run sb:auth -- --get` | Inspect auth config (site URL, redirects, email) |
| `npm run sb:auth -- --set …` | Patch auth config |

All three read `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` from
`.env.local`. Admin operations that need the service-role key
(`auth.admin.deleteUser`, etc.) should use the `@supabase/supabase-js` admin
client configured with `SUPABASE_SERVICE_ROLE_KEY` and
`auth: { persistSession: false, autoRefreshToken: false }`.
