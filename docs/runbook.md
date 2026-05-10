# InterviewFlow — Operations Runbook

> Quick reference for the solo operator. Keep this tab open during incidents.

---

## Table of contents

1. [Where things live](#1-where-things-live)
2. [Re-deploy a previous version on Vercel](#2-re-deploy-a-previous-version-on-vercel)
3. [Restore from a Supabase snapshot](#3-restore-from-a-supabase-snapshot)
4. [Rotate the Anthropic API key](#4-rotate-the-anthropic-api-key)
5. [Rotate the Supabase anon key](#5-rotate-the-supabase-anon-key)
6. [Disable AI without redeploying](#6-disable-ai-without-redeploying)
7. [Add a new SQL migration](#7-add-a-new-sql-migration)
8. [Wipe and reseed the database](#8-wipe-and-reseed-the-database)
9. [Check Vercel function logs](#9-check-vercel-function-logs)

---

## 1. Where things live

| Resource | URL |
|---|---|
| Live app | `https://YOUR_APP.vercel.app` |
| Vercel project | `https://vercel.com/dashboard` → interviewflow |
| Supabase project | `https://supabase.com/dashboard/project/YOUR_REF` |
| Anthropic keys | `https://console.anthropic.com/settings/keys` |
| Env vars (prod) | Vercel → Project → Settings → Environment Variables |

**The canonical .env reference is `.env.example` in the repository root.**
All actual secrets live in Vercel's environment variables — never in the repo.

---

## 2. Re-deploy a previous version on Vercel

### Via Vercel dashboard (fastest)
1. Go to Vercel → Project → **Deployments** tab.
2. Find the last known-good deployment (green checkmark).
3. Click the **⋯** menu → **Promote to Production**.
4. Confirm. Traffic switches in ~10 seconds.

### Via Vercel CLI
```bash
npm i -g vercel
vercel login
vercel ls                          # list deployments
vercel alias set <deployment-url> <your-production-domain>
```

### Via git revert
```bash
git log --oneline -10              # find the good commit hash
git revert HEAD                    # or: git revert <sha>
git push origin main               # triggers a new Vercel build
```

---

## 3. Restore from a Supabase snapshot

Supabase Pro and above include Point-in-Time Recovery (PITR).
Free tier has daily backups (retained for 7 days).

### Free tier — restore from a daily backup
1. Supabase Dashboard → Project → **Settings** → **Backups**.
2. Choose a backup timestamp → **Restore**.
3. This replaces the entire database. All data after the snapshot is lost.
4. After restore, verify storage buckets are intact (Supabase Storage → cv-files, documents).

### Manual backup before a risky migration
```bash
# Dump the entire database to a local file
pg_dump "postgresql://postgres:[DB_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  --no-owner --no-acl \
  -f backup-$(date +%Y%m%d).sql

# Restore (destructive — run on a test project first)
psql "postgresql://postgres:[DB_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  -f backup-20240101.sql
```

> **Storage files** (CVs, documents) live in Supabase Storage buckets and are NOT included in a database dump. Download them manually if you need a full backup.

---

## 4. Rotate the Anthropic API key

The AI key is server-side only. Rotating it takes ~1 minute with zero downtime.

1. Create a new key at **https://console.anthropic.com/settings/keys**.
2. In Vercel → Project → Settings → Environment Variables:
   - Edit `ANTHROPIC_API_KEY` → paste the new key → **Save**.
3. Trigger a redeployment (Vercel → Deployments → **Redeploy**).
4. Verify AI tools work on the live URL.
5. Delete the old key in the Anthropic console.

> The old key is valid until you delete it. There is no grace period needed.

---

## 5. Rotate the Supabase anon key

The anon key is client-side (bundled in JS). Rotating invalidates all active sessions.

1. Supabase → Settings → API → **Regenerate anon key**.
2. Copy the new key.
3. In Vercel → Environment Variables: update `VITE_SUPABASE_ANON_KEY`.
4. Redeploy (new JS bundle picks up the new key).
5. All users must sign in again via magic link.

---

## 6. Disable AI without redeploying

Set `VITE_AI_ENABLED` to `false` (or delete it) in Vercel environment variables, then redeploy. All three AI tools immediately fall back to mock responses. No code change needed.

---

## 7. Add a new SQL migration

> **Migration 0005 note:** If upgrading an existing project that was deployed before 2026-05-08,
> apply `supabase/migrations/0005_add_ai_role_summary.sql` manually via the Supabase SQL editor
> or `supabase db push`. This adds the `ai_role_summary JSONB` column to `job_applications`
> that the JD Parser "Save" feature writes to. Fresh installs that run all migrations in order
> are unaffected.



1. Create `supabase/migrations/000N_description.sql` (increment N).
2. Write idempotent SQL (`IF NOT EXISTS`, `IF EXISTS`, etc.).
3. Apply:
   ```bash
   supabase db push   # if using Supabase CLI
   # OR paste into Supabase SQL editor
   ```
4. Commit the file — it documents the schema history.

> Never edit an existing migration file after it has been applied to production. Always create a new one.

---

## 8. Wipe and reseed the database

**Destructive — only for dev/staging.**

```sql
-- In Supabase SQL editor
TRUNCATE TABLE
  job_applications, companies, contacts, tasks,
  calendar_events, cv_versions, documents,
  prepared_answers, ai_summaries, recent_activity
  CASCADE;
```

Then re-enter data through the UI, or run a seed script if one exists.

---

## 9. Check Vercel function logs

AI calls run in `/api/ai/*.ts` serverless functions.

### Dashboard
Vercel → Project → **Functions** tab → select a function → **Logs**.

### CLI (streaming)
```bash
vercel logs --follow
```

### Common errors

| Error | Likely cause | Fix |
|---|---|---|
| `401 Unauthorized` from Anthropic | Key rotated or invalid | Check `ANTHROPIC_API_KEY` in Vercel env vars |
| `504 Gateway Timeout` | AI call exceeded 30s | Prompt is too long; truncate JD text |
| `400 Bad Request` | Malformed request body | Check the panel's request payload in browser DevTools |
| Supabase `JWT expired` | Auth token stale | User refreshes the page; tokens auto-refresh via `autoRefreshToken: true` |
