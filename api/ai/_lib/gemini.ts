// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/_lib/gemini.ts
// Thin wrapper around the Google Gen AI SDK (@google/genai).
// Validates Gemini's JSON output with a Zod schema; retries once on failure.
// NEVER called from the browser — server-side only.
// The user's API key is per-request (BYOK from the `x-gemini-api-key` header).
//
// Two things here are load-bearing and were the reason the old wrapper
// returned empty output more often than it returned answers:
//
// 1. gemini-2.5-flash is a THINKING model. Reasoning tokens are billed against
//    maxOutputTokens, so a 1500-token cap could be spent entirely on thinking,
//    leaving an empty candidate — which surfaced as "response is not valid
//    JSON: ". Every call now sets an explicit thinkingBudget and a ceiling
//    generous enough that the answer still fits after the thinking.
// 2. A truncated reply (finishReason MAX_TOKENS) used to fail as a parse error,
//    which the UI reported as "the model replied in a shape this tool could
//    not read". It is now reported as what it is.
// ---------------------------------------------------------------------------

import { GoogleGenAI } from '@google/genai'
import type { z } from 'zod'

export const DEFAULT_MODEL = 'gemini-2.5-flash'

/** Reasoning tokens allowed before the answer starts. 0 disables thinking.
 *  Structured extraction does not benefit from it; coaching output does. */
export const NO_THINKING    = 0
export const LIGHT_THINKING = 2048

// ---------------------------------------------------------------------------
// Hebrew output instruction
// ---------------------------------------------------------------------------

export const HEBREW_SYSTEM_SUFFIX = `

Output language: Respond in modern professional Hebrew. Follow these rules for code-switching:
— Use English for: programming language and tool names (SQL, Python, JavaScript, React, TypeScript, etc.), technical concepts commonly used in English in Israeli tech (REST, OAuth, KPI, OKR, A/B test, ETL, ML, AI, CRM, API, SaaS, CI/CD), proper nouns (company names, product names, frameworks), and any acronyms.
— Do NOT transliterate technical terms; embed the English term directly in the Hebrew sentence.
— Use right-to-left punctuation conventions but keep numbers in Western Arabic numerals (1, 2, 3).
— The JSON structure and all keys must remain exactly as specified above. Only the string values change language.`

export function localeSystemSuffix(locale?: string | null): string {
  return locale === 'he' ? HEBREW_SYSTEM_SUFFIX : ''
}

// ---------------------------------------------------------------------------
// Header extraction
// ---------------------------------------------------------------------------

/** Pull the user-supplied Gemini key out of request headers. */
export function getGeminiApiKey(
  headers: Record<string, string | string[] | undefined>,
): string | undefined {
  const raw = headers['x-gemini-api-key']
  const v = Array.isArray(raw) ? raw[0] : raw
  return v && v.trim().length > 0 ? v.trim() : undefined
}

// ---------------------------------------------------------------------------
// Error normalisation — the SDK throws errors whose useful part is buried in a
// JSON string. The UI can only be honest about what went wrong if the message
// that reaches it says something.
// ---------------------------------------------------------------------------

export function describeGeminiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)

  const match = raw.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      const body = JSON.parse(match[0]) as {
        error?: { message?: string; status?: string; code?: number }
      }
      const inner = body.error
      if (inner?.message) {
        if (inner.status === 'INVALID_ARGUMENT' && /api key/i.test(inner.message))
          return 'The Gemini API key was rejected. Check it in Settings.'
        if (inner.code === 429 || inner.status === 'RESOURCE_EXHAUSTED')
          return 'Gemini quota exceeded for this key. Wait a minute, or check your quota in Google AI Studio.'
        if (inner.code === 403) return `Gemini refused the request: ${inner.message}`
        return inner.message
      }
    } catch { /* fall through to the raw message */ }
  }

  if (/api[_ ]?key/i.test(raw)) return 'The Gemini API key was rejected. Check it in Settings.'
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(raw))
    return 'Could not reach Google. Check your internet connection and try again.'
  return raw
}

// ---------------------------------------------------------------------------
// Raw text call
// ---------------------------------------------------------------------------

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }

export interface CallGeminiRawOptions {
  apiKey:     string
  system:     string
  /** Plain text user message. Mutually exclusive with `userParts`. */
  user?:      string
  /** Multimodal user message (text + inline base64 documents/images). */
  userParts?: GeminiPart[]
  maxTokens?: number
  model?:     string
  /** Reasoning-token allowance. Defaults to NO_THINKING for JSON extraction. */
  thinkingBudget?: number
  /** Set false to skip forced application/json output. */
  json?:      boolean
}

/** Thrown when the model hit its output ceiling instead of finishing. */
export class GeminiTruncatedError extends Error {
  constructor(public readonly partial: string) {
    super(
      'Gemini ran out of output space before finishing, so the answer was cut off. ' +
      'Try again, or shorten the input.',
    )
    this.name = 'GeminiTruncatedError'
  }
}

/** Thrown when the model returned no text at all. */
export class GeminiEmptyError extends Error {
  constructor(public readonly reason: string) {
    super(`Gemini returned an empty response (${reason}).`)
    this.name = 'GeminiEmptyError'
  }
}

export async function callGeminiRaw(opts: CallGeminiRawOptions): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey })

  const contents = opts.userParts
    ? [{ role: 'user' as const, parts: opts.userParts }]
    : [{ role: 'user' as const, parts: [{ text: opts.user ?? '' }] }]

  const response = await ai.models.generateContent({
    model:    opts.model ?? DEFAULT_MODEL,
    contents,
    config: {
      systemInstruction: opts.system,
      maxOutputTokens:   opts.maxTokens ?? 8192,
      thinkingConfig:    { thinkingBudget: opts.thinkingBudget ?? NO_THINKING },
      ...(opts.json === false ? {} : { responseMimeType: 'application/json' }),
    },
  })

  const text   = response.text ?? ''
  const finish = response.candidates?.[0]?.finishReason

  if (!text.trim()) {
    if (finish === 'MAX_TOKENS') throw new GeminiTruncatedError('')
    throw new GeminiEmptyError(String(finish ?? 'no candidates'))
  }
  if (finish === 'MAX_TOKENS') throw new GeminiTruncatedError(text)

  return text
}

// ---------------------------------------------------------------------------
// JSON + schema-validated call. Retries exactly once on a shape mismatch.
// ---------------------------------------------------------------------------

export interface CallGeminiOptions<T> {
  apiKey:     string
  system:     string
  user?:      string
  userParts?: GeminiPart[]
  schema:     z.ZodType<T>
  maxTokens:  number
  model?:     string
  thinkingBudget?: number
}

export async function callGemini<T>(opts: CallGeminiOptions<T>): Promise<T> {
  const firstText   = await callGeminiRaw(opts)
  const firstResult = opts.schema.safeParse(parseJSON(firstText))
  if (firstResult.success) return firstResult.data

  const issues = firstResult.error.issues
    .map(i => `• ${i.path.join('.')}: ${i.message}`)
    .join('\n')

  const originalSummary = opts.user ?? '(multimodal input — see previous output)'

  const retryText = await callGeminiRaw({
    apiKey: opts.apiKey,
    system: opts.system,
    user:
      'Your previous JSON output failed validation. Fix these issues and return ONLY the corrected JSON object.\n\n' +
      `Issues:\n${issues}\n\nPrevious output:\n${firstText}\n\nOriginal request:\n${originalSummary}`,
    maxTokens:      opts.maxTokens,
    model:          opts.model,
    thinkingBudget: NO_THINKING,
  })
  const retryResult = opts.schema.safeParse(parseJSON(retryText))
  if (retryResult.success) return retryResult.data

  const retryIssues = retryResult.error.issues
    .map(i => `${i.path.join('.')}: ${i.message}`)
    .join('; ')
  throw new Error(`Gemini output failed validation after retry: ${retryIssues}`)
}

// ---------------------------------------------------------------------------
// JSON parser — responseMimeType=application/json normally returns clean JSON,
// but grounded calls cannot set it, so be defensive about fences and prose.
// ---------------------------------------------------------------------------

function parseJSON(text: string): unknown {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  try {
    return JSON.parse(stripped)
  } catch {
    // Widest brace span, so a JSON object wrapped in commentary still parses.
    const start = stripped.indexOf('{')
    const end   = stripped.lastIndexOf('}')
    if (start !== -1 && end > start) {
      try { return JSON.parse(stripped.slice(start, end + 1)) } catch { /* fall through */ }
    }
    throw new Error(`Gemini response is not valid JSON: ${stripped.slice(0, 200)}`)
  }
}

// ---------------------------------------------------------------------------
// Grounded call — answers from Google Search and (optionally) named URLs
// rather than from training data.
//
// The API refuses responseMimeType='application/json' together with tools, so
// JSON is requested in the prompt and parsed out of the reply. If the grounded
// reply will not validate, a second UNGROUNDED pass reformats the researched
// text into shape — that keeps the facts and only repairs the container.
// ---------------------------------------------------------------------------

export interface GroundingSource {
  title?: string
  uri?:   string
}

export interface GroundedResult<T> {
  data:    T
  sources: GroundingSource[]
}

export interface CallGeminiGroundedOptions<T> extends CallGeminiOptions<T> {
  /** Let the model read these URLs directly, in addition to searching. */
  urls?: string[]
}

/** True when the API refused the tool combination rather than the request. */
function isToolRejection(err: unknown): boolean {
  const raw = (err instanceof Error ? err.message : String(err)).toLowerCase()
  return (
    raw.includes('url_context') ||
    raw.includes('urlcontext') ||
    (raw.includes('tool') &&
      (raw.includes('not supported') ||
       raw.includes('unsupported') ||
       raw.includes('invalid_argument')))
  )
}

export async function callGeminiGrounded<T>(
  opts: CallGeminiGroundedOptions<T>,
): Promise<GroundedResult<T>> {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey })

  // urlContext lets Gemini fetch the exact page the user pasted — a LinkedIn
  // or careers-site job posting — instead of guessing from the URL slug.
  const wantsUrlContext = !!opts.urls && opts.urls.length > 0

  const send = (tools: object[]) =>
    ai.models.generateContent({
      model:    opts.model ?? DEFAULT_MODEL,
      contents: [{ role: 'user', parts: [{ text: opts.user ?? '' }] }],
      config: {
        systemInstruction: opts.system,
        maxOutputTokens:   opts.maxTokens,
        thinkingConfig:    { thinkingBudget: opts.thinkingBudget ?? LIGHT_THINKING },
        tools,
      },
    })

  let response
  if (wantsUrlContext) {
    try {
      response = await send([{ googleSearch: {} }, { urlContext: {} }])
    } catch (err) {
      // Which tools may be combined has changed more than once across model
      // versions, and the API rejects an unsupported pairing outright. Search
      // alone still answers the question, so degrade rather than fail: the
      // model finds the posting instead of being handed it.
      if (!isToolRejection(err)) throw err
      console.warn('[gemini] urlContext rejected, retrying with search only')
      response = await send([{ googleSearch: {} }])
    }
  } else {
    response = await send([{ googleSearch: {} }])
  }

  const text      = response.text ?? ''
  const candidate = response.candidates?.[0]

  const chunks = candidate?.groundingMetadata?.groundingChunks ?? []
  const seen   = new Set<string>()
  const sources: GroundingSource[] = chunks
    .map((c): GroundingSource => ({ title: c.web?.title, uri: c.web?.uri }))
    .filter(s => {
      if (!s.uri || seen.has(s.uri)) return false
      seen.add(s.uri)
      return true
    })

  if (!text.trim()) {
    throw new GeminiEmptyError(String(candidate?.finishReason ?? 'no candidates'))
  }

  let issues = 'the reply was not a JSON object'
  try {
    const parsed = opts.schema.safeParse(parseJSON(text))
    if (parsed.success) return { data: parsed.data, sources }
    issues = parsed.error.issues.map(i => `• ${i.path.join('.')}: ${i.message}`).join('\n')
  } catch {
    /* fall through to the repair pass */
  }

  const repaired = await callGemini({
    apiKey: opts.apiKey,
    system: opts.system,
    user:
      'Reformat the research below into the required JSON object. Do not add facts that are not present in it.\n\n' +
      `Validation issues to fix:\n${issues}\n\nResearch:\n${text}`,
    schema:         opts.schema,
    maxTokens:      opts.maxTokens,
    model:          opts.model,
    thinkingBudget: NO_THINKING,
  })
  return { data: repaired, sources }
}
