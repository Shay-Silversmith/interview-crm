# AI Serverless Functions — Operations Guide

Seven Vercel serverless functions proxy requests from the browser to
**Google Gemini** (`gemini-2.5-pro`). The browser sends each request with a
header `x-gemini-api-key: <user's key>`; the function forwards the key only
to Google's Gemini API and never persists it.

---

## BYOK (Bring Your Own Key) model

Each user pastes their own Gemini API key into Settings → AI Preferences
(UI shipping in Prompt 3b). The key lives in the user's browser
`localStorage` under the slot `interviewflow_gemini_key` and is attached as
the `x-gemini-api-key` header to every `/api/ai/*` request.

**Security tradeoff:** `localStorage` is readable by any script running in
the same origin — including a successful XSS. This is acceptable for the
friend-beta phase: the blast radius is the user's own Gemini quota.

Stronger alternatives for a future iteration:
- **Per-user DB column** (`profiles.gemini_api_key`, RLS-protected) — the
  key still lives in plaintext but never in the browser. Requires routing
  every `/api/ai/*` call through a Supabase session lookup.
- **Supabase Vault** — provider-managed secret storage. Same routing
  requirement as above, plus encryption-at-rest beyond the table.

Users generate Gemini keys at https://aistudio.google.com/app/apikey

---

## Environment variables

| Variable | Where | Required |
|---|---|---|
| `VITE_AI_ENABLED` | `.env.local` + Vercel envs | Yes — set to `true` to call the real backend |
| `VITE_SUPABASE_URL` | `.env.local` + Vercel envs | Yes for live mode |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` + Vercel envs | Yes for live mode |

There is **no longer** a server-side AI key env var. The Anthropic
`ANTHROPIC_API_KEY` from the Claude era was removed in p3a.

---

## Endpoints (all `POST /api/ai/<name>`)

| Endpoint | What it does |
|---|---|
| `jd-parser` | Parses a JD into structured insights (responsibilities, requirements, how I match, etc.) |
| `prep-pack` | Generates a personalised interview prep pack from application + CV + past rounds |
| `follow-up` | Drafts three follow-up message variants (short / warm / LinkedIn) |
| `company-fill` | Researches a company name and returns structured CRM fields |
| `cv-parse` | Extracts emphasis / skills / projects from an uploaded CV (multimodal: PDF & images) |
| `jd-summarize` | Turns a pasted JD into headline + bullet summary |
| `agent` | Conversational planner — takes a user message + open-applications context, returns proposed mutations for the user to approve |
| `_test` | Trivial Gemini probe used by the "Test key" button in Settings |

---

## Migration notes from Claude → Gemini (p3a)

| Aspect | Claude (old) | Gemini (now) |
|---|---|---|
| Model | `claude-sonnet-4-6` | `gemini-2.5-pro` |
| Key source | Server env `ANTHROPIC_API_KEY` (with optional BYOK `x-anthropic-key`) | Always BYOK — header `x-gemini-api-key` |
| JSON output | Prompted via "ONLY a JSON object" | Native `responseMimeType: 'application/json'` |
| `company-fill` web research | `web_search_20250305` server tool | None — Gemini answers from training-data knowledge only |
| `jd-summarize` URL fetch | `web_fetch_20250910` server tool | None — caller should paste JD text |
| `cv-parse` multimodal | Claude `document` / `image` blocks | Gemini `inlineData` parts |

The `_lib/claude.ts` wrapper was deleted; `_lib/gemini.ts` is the new
single entry point. The `@anthropic-ai/sdk` dep was removed.

---

## Curl examples

```bash
# JD parser
curl -X POST http://localhost:5173/api/ai/jd-parser \
  -H 'content-type: application/json' \
  -H "x-gemini-api-key: $GEMINI_KEY" \
  -d '{
    "jdText": "We are looking for a Data Engineer...",
    "roleTitle": "Data Engineer",
    "userBackground": "Industrial Engineering, 1y analytics internship"
  }'

# Probe (no quota cost beyond ~30 tokens)
curl -X POST http://localhost:5173/api/ai/_test \
  -H "x-gemini-api-key: $GEMINI_KEY"
```

---

## Failure modes

| HTTP | Cause | Frontend behaviour |
|---|---|---|
| `401 NO_API_KEY` | User hasn't set a Gemini key | Toast: "Set your Gemini API key in Settings to use AI features." |
| `429 Rate limit` | IP-based limit (see `_lib/rate-limit.ts`) | Toast with wait time |
| `400` | Zod request validation failed | Toast with field-level error |
| `500` | Gemini error after retry | DEV: surface to console; PROD: silent mock fallback |
| `502` (only `_test`) | Gemini rejected the key or network error | Settings UI shows red status |
