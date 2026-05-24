# InterviewFlow

**AI-powered Job Search CRM & Interview Preparation**

Track every application, prep for every interview, and use AI to stay one step ahead — all in one place.

---

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Auth & DB | Supabase (Postgres + Row-Level Security) |
| Storage | Supabase Storage (cv-files, documents buckets) |
| AI | Google Gemini (`gemini-2.5-pro`) via Vercel serverless functions — BYOK |
| Hosting | Vercel |

---

## Local development

### Prerequisites
- Node.js 20+
- A Supabase project (free tier is fine) **or** run entirely in mock/demo mode (no backend needed)

### 1 — Clone and install

```bash
git clone https://github.com/your-username/interview-crm.git
cd interview-crm
npm install
```

### 2 — Environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your values (see comments inside)
```

**To run in mock/demo mode** (no Supabase): leave `VITE_SUPABASE_URL` unset — the app works fully offline with in-memory data.

**To enable AI features locally**: set `VITE_AI_ENABLED=true` in `.env.local`, start the dev server with the Vercel CLI so the serverless functions work, then paste your personal Gemini API key into Settings → AI Preferences (UI shipping in Prompt 3b; until then, set it manually via DevTools: `localStorage.setItem('interviewflow_gemini_key','<your-key>')`).
```bash
npm i -g vercel
vercel dev   # starts both Vite and /api/* functions on http://localhost:3000
```
Generate a Gemini key at https://aistudio.google.com/app/apikey. The key
lives only in your browser's localStorage; it is sent as the
`x-gemini-api-key` header on each `/api/ai/*` request and forwarded only to
Google's API. Without a key the AI tools fall back to mock responses
(non-DEV) or surface a clear error toast (DEV).

### 3 — Start

```bash
npm run dev   # http://localhost:5173
```

---

## Production deploy

### Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Choose a region close to your users, set a strong DB password.
3. Note your **Project URL** and **anon public key** (Settings → API).

### Step 2 — Apply database migrations

**Option A — Supabase CLI (recommended)**
```bash
npm i -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

**Option B — SQL editor**
Paste the contents of each file in order into the Supabase SQL editor:
1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_rls.sql`
3. `supabase/migrations/0003_storage.sql`
4. `supabase/migrations/0004_add_storage_path.sql`

### Step 3 — Seed data (optional)

The app is fully usable with real data you enter via the UI. If you want demo data:
```bash
# In Supabase SQL editor — run supabase/seed.sql (if present)
```

### Step 4 — Push to GitHub

```bash
git add -A
git commit -m "Initial deploy"
git push origin main
```

### Step 5 — Import to Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project.
2. Import your GitHub repository.
3. Vercel auto-detects Vite. Keep all defaults.

### Step 6 — Set environment variables in Vercel

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Value | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | From Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `eyJ…` | anon public key |
| `VITE_AI_ENABLED` | `true` | Enables live AI tools |
| `VITE_ADMIN_EMAIL` | `you@example.com` | Email of the admin user; gates demo-mode UI |

No server-side AI key is needed — users provide their own Gemini key in
the app's Settings (BYOK).

### Step 7 — Deploy

Click **Deploy** in Vercel. First build takes ~45 seconds.

### Step 8 — Sign in

Visit your live URL (e.g. `https://interviewflow-abc123.vercel.app`).

1. Enter your email → click **Send magic link**.
2. Click the link in your email → you're in.

> **Tip:** bookmark `https://your-app.vercel.app` or use the Vercel custom domain flow to set up `interviewflow.yourdomain.com`.

### Add to Home Screen (iOS)

1. Open the live URL in **Safari** on iPhone.
2. Tap the **Share** button → **Add to Home Screen**.
3. Tap **Add** — InterviewFlow now opens as a standalone app.

---

## Generate Supabase TypeScript types

After changing the schema, regenerate types:

```bash
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_REF \
  > src/types/database.ts
```

---

## Environment variables reference

See `.env.example` for full descriptions. Quick summary:

| Variable | Required | Where used |
|---|---|---|
| `VITE_SUPABASE_URL` | For prod | Supabase client |
| `VITE_SUPABASE_ANON_KEY` | For prod | Supabase client |
| `VITE_AI_ENABLED` | Optional | Feature flag — set `true` to call live Gemini |
| `VITE_ADMIN_EMAIL` | Optional | Email of the admin user; gates demo-mode UI |

---

## Project structure

```
src/
  api/          # Vercel serverless functions (/api/ai/*)
  components/   # Shared UI + domain components
  contexts/     # React context (SearchContext)
  data/         # Mock data store + seed helpers
  hooks/        # Custom React hooks
  lib/          # Utilities: supabase client, storage, mappers, env
  pages/        # Route-level page components
  services/     # Data access layer (mock + Supabase)
  types/        # Entity types + Supabase DB types
  utils/        # Pure helpers (date, format)
supabase/
  migrations/   # SQL migration files (apply in order)
public/
  manifest.webmanifest
  icon-192.png  # PWA icons
  icon-512.png
docs/
  runbook.md    # Ops reference
```
