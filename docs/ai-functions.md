# AI Serverless Functions — Operations Guide

Three Vercel serverless functions proxy requests from the browser to Anthropic's Claude API. The browser **never** holds the API key.

---

## Environment Variables

| Variable | Where | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | Vercel env vars (or `.env.local`) | Yes |
| `VITE_SUPABASE_URL` | Vercel env vars / `.env.local` | No (mock mode if absent) |
| `VITE_SUPABASE_ANON_KEY` | Vercel env vars / `.env.local` | No |

Add your Anthropic key to `.env.local` for local dev:

```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Get a key at <https://console.anthropic.com/>.

---

## Local Development

Use **`vercel dev`** (not `npm run dev`) so serverless functions are served alongside the Vite frontend:

```bash
npm install -g vercel        # one-time
vercel login                 # one-time
vercel dev                   # runs on http://localhost:3000
```

> `npm run dev` starts Vite only (port 5173) — API calls to `/api/ai/*` will 404 because Vercel's function runtime isn't running.

---

## Hebrew Output Mode

When the app locale is `he`, the frontend passes `"locale": "he"` in the request body to the **Prep Pack** and **Follow-up** endpoints. The server appends a language instruction to the system prompt:

> Respond in modern professional Hebrew. Use English for programming language and tool names (SQL, Python, JavaScript, React, etc.), technical concepts commonly used in Israeli tech (REST, OAuth, KPI, OKR, A/B test, ETL, ML, AI, CRM, API, SaaS, CI/CD), proper nouns (company names, products, frameworks), and any acronyms. Embed English terms directly in Hebrew sentences (e.g., "הפרויקט בנוי ב-React עם TypeScript"). Use Western Arabic numerals.

**JD Parser intentionally ignores `locale`** — job descriptions are written in English, and structured fields (`responsibilities`, `requirements`, etc.) read better in their source language. The endpoint accepts the field for API schema consistency but discards it.

Only *newly generated* drafts are affected. Saved AI summaries from previous sessions render exactly as they were stored, regardless of the current locale.

The JSON response shape is identical in both languages — only the string *values* change. The frontend adds `dir="auto"` to all AI text containers so that mixed Hebrew/English content (e.g., "הפרויקט משתמש ב-Python ו-SQL") renders with correct bidirectionality without explicit bidi markup.

---

## Endpoints

### `POST /api/ai/jd-parser`

Parse a job description into structured insights.

**Request**

```json
{
  "jdText": "We are looking for a Data Engineer…",
  "roleTitle": "Data Engineer",           // optional
  "userBackground": "BGU IS, 3y Unit 9900", // optional
  "locale": "en"                          // optional — accepted but IGNORED (output always English)
}
```

**Response (success)**

```json
{
  "ok": true,
  "data": {
    "roleSummary": "…",
    "responsibilities": ["…"],
    "requirements": ["…"],
    "niceToHaves": ["…"],
    "technologies": ["…"],
    "whatTheyWant": "…",
    "howIMatch": ["…"],
    "whatToEmphasize": ["…"],
    "possibleQuestions": ["…"],
    "prepChecklist": ["…"]
  }
}
```

**cURL test**

```bash
curl -X POST http://localhost:3000/api/ai/jd-parser \
  -H "Content-Type: application/json" \
  -d '{"jdText":"We need a senior data engineer with 5+ years Spark experience."}'
```

---

### `POST /api/ai/prep-pack`

Generate a comprehensive interview prep pack.

**Request**

```json
{
  "application": {
    "title": "Data Engineer",
    "company": "Amazon",
    "stage": "Applied",
    "jdText": "…",        // optional
    "notes": "…"          // optional
  },
  "cv": null,
  "company": { "name": "Amazon" },
  "pastInterviews": [],
  "userBackground": "BGU IS Engineering, Python/SQL",
  "interviewType": "Technical Interview",
  "locale": "he"                          // optional — omit or "en" for English output
}
```

**Response (success)**

```json
{
  "ok": true,
  "data": {
    "companySnapshot": "…",
    "roleSummary": "…",
    "reviewFromCV": ["…"],
    "expectedHRQuestions": ["…"],
    "expectedTechnicalQuestions": ["…"],
    "recommendedStarStories": [
      { "situation": "…", "task": "…", "action": "…", "result": "…" }
    ],
    "questionsToAsk": ["…"],
    "finalChecklist": ["…"]
  }
}
```

**cURL test**

```bash
curl -X POST http://localhost:3000/api/ai/prep-pack \
  -H "Content-Type: application/json" \
  -d '{
    "application":{"title":"Data Engineer","company":"Amazon","stage":"Applied"},
    "cv":null,
    "company":{"name":"Amazon"},
    "pastInterviews":[],
    "userBackground":"BGU IS Engineering, Python/SQL, 3y Unit 9900",
    "interviewType":"Technical Interview"
  }'
```

---

### `POST /api/ai/follow-up`

Draft three follow-up message variants.

**Request**

```json
{
  "messageType": "post-interview",
  "company": "Wix",
  "contactName": "Lihi Shachar",
  "role": "Data Engineer",
  "tone": "warm",
  "context": "Had a 45-min video call with the data team lead",
  "locale": "he"                          // optional — omit or "en" for English output
}
```

`messageType` values: `post-interview` | `ping-after-silence` | `thank-you` | `decline-politely`

`tone` values: `professional` | `warm` | `casual`

**Response (success)**

```json
{
  "ok": true,
  "data": {
    "short":    "Hi Lihi, thank you for your time yesterday…",
    "warm":     "Hi Lihi,\n\nI really enjoyed our conversation…",
    "linkedIn": "Hi Lihi — great chatting yesterday…"
  }
}
```

**cURL test**

```bash
curl -X POST http://localhost:3000/api/ai/follow-up \
  -H "Content-Type: application/json" \
  -d '{
    "messageType":"post-interview",
    "company":"Wix",
    "contactName":"Lihi Shachar",
    "role":"Data Engineer",
    "tone":"warm",
    "context":"45-min video call with data team lead"
  }'
```

---

## Error Response Shape

All errors return `{ "ok": false, "error": "…" }`:

| HTTP status | Cause |
|---|---|
| `400` | Invalid request body (Zod validation) |
| `405` | Wrong HTTP method (only POST allowed) |
| `429` | Rate limit exceeded (10 req/min per IP) |
| `500` | Anthropic API error or JSON parse failure after retry |

---

## Rate Limiting

- **Limit:** 10 requests per minute per IP
- **Algorithm:** Sliding window (in-memory)
- **Headers returned on 429:** none (just `{ ok: false, error: "Rate limit exceeded. Try again in Xs." }`)
- **Scope:** Per function, per IP — limits are independent across the three endpoints
- **Reset:** Automatic; the bucket is cleared after 60 seconds of inactivity

> ⚠️ In-memory rate limiting is per-instance. On Vercel's multi-instance deployments this provides best-effort protection, not hard enforcement. For production hardening, replace with a Redis-backed solution (Upstash recommended).

---

## Retry Behaviour

Each function calls Claude once and validates the JSON response with Zod. If validation fails, a single correction turn is sent:

```
Your JSON output failed validation. Fix these issues and return ONLY the corrected JSON object:
<validation issues summary>
```

If the retry also fails validation, the function returns `{ ok: false, error: "…" }` with HTTP 500.

---

## Model & Token Limits

| Function | Model | maxTokens |
|---|---|---|
| jd-parser | `claude-sonnet-4-6` | 1500 |
| prep-pack | `claude-sonnet-4-6` | 2500 |
| follow-up | `claude-sonnet-4-6` | 1200 |

Vercel function timeout: **30 seconds** (configured in `vercel.json`).

---

## Deployment

```bash
vercel --prod
```

Add `ANTHROPIC_API_KEY` in the Vercel project dashboard under **Settings → Environment Variables** (Production + Preview scopes). Never commit it to the repo.
