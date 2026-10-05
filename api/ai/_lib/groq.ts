// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/_lib/groq.ts
// Backup LLM, used only when Gemini cannot answer.
//
// Gemini stays the primary: it is the key each user brings, and its answers
// are the ones the prompts were tuned against. But its free tier fails in ways
// no retry fixes — every flash model overloaded at once, a daily allowance
// spent by lunchtime — and a tool that says "try again later" has not done its
// job. When that happens, and only then, the same prompt goes to Groq.
//
// The key belongs to whoever deploys the app (GROQ_API_KEY, server-side) and
// is shared by every user, like the search key. Leave it unset and nothing
// here runs: Gemini's own error is reported as before.
//
// Groq speaks the OpenAI chat-completions dialect, so this is a plain fetch
// rather than another SDK.
// ---------------------------------------------------------------------------

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

/**
 * Tried in order. The second exists because Groq retires and renames models
 * about as often as Google does; GROQ_MODEL overrides the first.
 */
const DEFAULT_MODELS = ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b']

/**
 * Groq's free tier meters tokens per minute, and a request larger than the
 * minute's allowance is refused outright rather than queued. The research
 * prompts carry a dozen pages of search results, so they are cut to fit: a
 * shorter briefing is worth more than a 413.
 */
const MAX_USER_CHARS  = 20_000
const MAX_OUTPUT_TOKENS = 4_096

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim())
}

export interface CallGroqOptions {
  system:     string
  user:       string
  maxTokens?: number
  /** Set false for prose. Defaults to forced JSON, matching callGeminiRaw. */
  json?:      boolean
}

export async function callGroq(opts: CallGroqOptions): Promise<string> {
  const key = process.env.GROQ_API_KEY?.trim()
  if (!key) throw new Error('Groq is not configured')

  const override = process.env.GROQ_MODEL?.trim()
  const models   = override ? [override, ...DEFAULT_MODELS.filter(m => m !== override)] : DEFAULT_MODELS

  let lastError: unknown
  for (const model of models) {
    try {
      return await send(key, model, opts)
    } catch (err) {
      lastError = err
      // Only a missing model is worth trying the next one for; a rejected key
      // or a spent allowance will be the same answer on every model.
      if (!/HTTP 404|model_not_found|decommissioned|does not exist/i.test(String(err))) throw err
    }
  }
  throw lastError
}

async function send(key: string, model: string, opts: CallGroqOptions): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 40_000)

  const res = await fetch(ENDPOINT, {
    method:  'POST',
    signal:  controller.signal,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user',   content: opts.user.slice(0, MAX_USER_CHARS) },
      ],
      max_completion_tokens: Math.min(opts.maxTokens ?? MAX_OUTPUT_TOKENS, MAX_OUTPUT_TOKENS),
      temperature: 0.3,
      ...(opts.json === false ? {} : { response_format: { type: 'json_object' } }),
    }),
  }).finally(() => clearTimeout(timer))

  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 300)
    throw new Error(`Groq HTTP ${res.status}${detail ? ` — ${detail}` : ''}`)
  }

  const body = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  const text = body.choices?.[0]?.message?.content ?? ''
  if (!text.trim()) throw new Error('Groq returned no text')
  return text
}
