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

/**
 * Used for the structuring pass after a grounded search.
 *
 * That pass is a transcription job — take these notes, emit them in this shape,
 * add nothing — and it does not need the same model that did the reasoning. It
 * draws on a separate, more generous quota, which halves what a research tool
 * costs against the flash limit. On the free tier that is the difference
 * between a handful of company briefings a day and roughly twice as many.
 */
export const STRUCTURING_MODEL = 'gemini-3.5-flash-lite'

/**
 * Where to go when a model is retired.
 *
 * Google withdraws older models from new accounts without warning — a key that
 * worked yesterday starts refusing gemini-2.5-flash-lite with "no longer
 * available to new users", and the tool dies on a line of code that was correct
 * when it was written. The first request to hit that error retries on the
 * successor rather than surfacing a failure the user cannot act on.
 */
const MODEL_FALLBACKS: Record<string, string> = {
  'gemini-2.5-flash-lite': 'gemini-3.5-flash-lite',
  'gemini-2.5-flash':      'gemini-3.5-flash',
  'gemini-2.5-pro':        'gemini-3.5-pro',
}

/** True when the API refused because the model is gone, not because of the request. */
function isModelUnavailable(err: unknown): boolean {
  const raw = (err instanceof Error ? err.message : String(err)).toLowerCase()
  return (
    raw.includes('no longer available') ||
    raw.includes('is not found') ||
    raw.includes('not supported for') ||
    (raw.includes('model') && raw.includes('not found'))
  )
}

/**
 * Sends a request, and retries once on the successor model if this one has been
 * retired. Every call in this file goes through here so the fallback applies
 * uniformly, including the grounded path.
 */
async function generateWithFallback(
  ai: GoogleGenAI,
  params: { model: string; contents: unknown; config: unknown },
): Promise<Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>> {
  type GenParams = Parameters<GoogleGenAI['models']['generateContent']>[0]
  try {
    return await ai.models.generateContent(params as unknown as GenParams)
  } catch (err) {
    const successor = MODEL_FALLBACKS[params.model]
    if (!successor || !isModelUnavailable(err)) throw err
    console.warn(`[gemini] ${params.model} unavailable, retrying on ${successor}`)
    return ai.models.generateContent({ ...params, model: successor } as unknown as GenParams)
  }
}

/**
 * Reasoning tokens allowed before the answer starts.
 *
 * 0 disables thinking — right for structured extraction, which does not benefit.
 * -1 hands the budget to the model, which is the only safe setting for a call
 * that also runs tools: a fixed small budget can be consumed entirely by the
 * search-and-reason loop, and the model then finishes with finishReason STOP
 * and no text at all. That empty-but-successful response is the same failure as
 * the original 1500-token ceiling, reached by a different road.
 */
export const NO_THINKING      = 0
export const LIGHT_THINKING   = 2048
export const DYNAMIC_THINKING = -1

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
        if (inner.code === 429 || inner.status === 'RESOURCE_EXHAUSTED') {
          // Google names the limit it hit in the violation details, and per-day
          // and per-minute call for completely different responses: one means
          // wait a minute, the other means you are done until the reset.
          const raw429 = JSON.stringify(body)
          const perDay = /PerDay|RequestsPerDay/i.test(raw429)
          const perMin = /PerMinute|RequestsPerMinute/i.test(raw429)
          const which  = perDay ? 'daily' : perMin ? 'per-minute' : 'unspecified'
          return (
            `Gemini quota exceeded (${which} limit). ` +
            (perDay
              ? 'The daily allowance for this key is spent; it resets at midnight Pacific time.'
              : perMin
                ? 'Wait about a minute and try again.'
                : 'Wait a minute, then check the quota for this key in Google AI Studio.') +
            ` Google said: ${inner.message}`
          )
        }
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
    super(
      `Gemini finished without writing anything (${reason}). ` +
      'This is usually transient — try again.',
    )
    this.name = 'GeminiEmptyError'
  }
}

export async function callGeminiRaw(opts: CallGeminiRawOptions): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey })

  const contents = opts.userParts
    ? [{ role: 'user' as const, parts: opts.userParts }]
    : [{ role: 'user' as const, parts: [{ text: opts.user ?? '' }] }]

  const response = await generateWithFallback(ai, {
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
  let firstText: string
  try {
    firstText = await callGeminiRaw(opts)
  } catch (err) {
    // An empty body with a clean finishReason is transient. One retry costs a
    // few seconds; surfacing it costs the user the whole result.
    if (!(err instanceof GeminiEmptyError)) throw err
    console.warn(`[gemini] empty response (${err.reason}); retrying once`)
    firstText = await callGeminiRaw(opts)
  }

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

/**
 * Research first, structure second — deliberately two calls.
 *
 * The API forbids responseMimeType='application/json' alongside tools, so the
 * earlier version asked a search-driven model for a strict multi-field JSON
 * object in prose mode and hoped. It kept coming back finished-with-no-text:
 * grounded models are dependable at writing a report and fragile at emitting a
 * rigid schema they were only asked for in words, and no amount of adjusting
 * the thinking budget or the token ceiling changed that.
 *
 * So the search step is now asked for exactly what it is good at — prose — and
 * a second, cheap, ungrounded call turns that into the schema with JSON mode
 * actually switched on. The second call adds no facts; it only reshapes. Two
 * short reliable calls beat one long fragile one.
 */
/**
 * Stage one on its own: search the web and write prose notes.
 *
 * Exposed separately because research and structuring together can exceed the
 * host's 60-second function limit even after the tools were split in half. They
 * are two Gemini calls either way, so running them as two HTTP requests costs
 * no extra quota and gives each stage its own clock.
 */
export async function researchGrounded(
  opts: Omit<CallGeminiGroundedOptions<unknown>, 'schema'>,
): Promise<{ research: string; sources: GroundingSource[] }> {
  const { research, sources } = await runResearch(opts)
  if (!research.trim()) throw new GeminiEmptyError('no text after retry')
  return { research, sources }
}

/** Stage two on its own: reshape existing notes into the schema. Adds no facts. */
export async function structureResearch<T>(opts: {
  apiKey:    string
  system:    string
  research:  string
  schema:    z.ZodType<T>
  maxTokens: number
  model?:    string
}): Promise<T> {
  return callGemini({
    apiKey: opts.apiKey,
    system: opts.system,
    user:   structuringPrompt(opts.research),
    schema: opts.schema,
    maxTokens:      opts.maxTokens,
    model:          opts.model ?? STRUCTURING_MODEL,
    thinkingBudget: NO_THINKING,
  })
}

function structuringPrompt(research: string): string {
  return (
    'Convert the research notes below into the required JSON object.\n\n' +
    'Rules for this step: use only what the notes contain. Do not add, infer, or ' +
    'embellish any fact. If the notes do not cover a field, use an empty list, an ' +
    'empty string, or null as the schema allows.\n\n' +
    `RESEARCH NOTES:\n${research}`
  )
}

export async function callGeminiGrounded<T>(
  opts: CallGeminiGroundedOptions<T>,
): Promise<GroundedResult<T>> {
  const { research, sources } = await runResearch(opts)

  if (!research.trim()) throw new GeminiEmptyError('no text after retry')

  const data = await structureResearch({
    apiKey:    opts.apiKey,
    system:    opts.system,
    research,
    schema:    opts.schema,
    maxTokens: opts.maxTokens,
    model:     opts.model,
  })

  return { data, sources }
}

async function runResearch(
  opts: Omit<CallGeminiGroundedOptions<unknown>, 'schema'>,
): Promise<{ research: string; sources: GroundingSource[] }> {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey })

  // urlContext lets Gemini fetch the exact page the user pasted — a LinkedIn
  // or careers-site job posting — instead of guessing from the URL slug.
  const wantsUrlContext = !!opts.urls && opts.urls.length > 0

  // The endpoint's system prompt describes the JSON it ultimately wants. For
  // the research pass that instruction is actively harmful, so it is overridden
  // here: cover the same ground, but write it as notes.
  const researchSystem =
    `${opts.system}\n\n` +
    'IMPORTANT OVERRIDE FOR THIS STEP: do NOT return JSON. Research the request using ' +
    'Google Search, then write your findings as plain prose notes under short headings — ' +
    'one heading per field named above, in the same order, using the field name as the ' +
    'heading. Include every fact you would have put in each field, and keep the length ' +
    'caps described above. A separate step converts your notes into JSON, so formatting ' +
    'does not matter here; completeness and accuracy do.'

  const send = (tools: object[]) =>
    generateWithFallback(ai, {
      model:    opts.model ?? DEFAULT_MODEL,
      contents: [{ role: 'user', parts: [{ text: opts.user ?? '' }] }],
      config: {
        systemInstruction: researchSystem,
        tools,
        // No maxOutputTokens and no thinkingConfig here on purpose. Both were
        // implicated in the empty responses, and the prompt's own length caps
        // bound the output better than a token ceiling does.
      },
    })

  const attempt = async () => {
    if (!wantsUrlContext) return send([{ googleSearch: {} }])
    try {
      return await send([{ googleSearch: {} }, { urlContext: {} }])
    } catch (err) {
      // Which tools may be combined has changed more than once across model
      // versions, and the API rejects an unsupported pairing outright. Search
      // alone still answers the question, so degrade rather than fail: the
      // model finds the posting instead of being handed it.
      if (!isToolRejection(err)) throw err
      console.warn('[gemini] urlContext rejected, retrying with search only')
      return send([{ googleSearch: {} }])
    }
  }

  let response = await attempt()

  if (!(response.text ?? '').trim()) {
    const finish = response.candidates?.[0]?.finishReason
    console.warn(`[gemini] grounded research returned no text (${finish ?? 'no candidate'}); retrying once`)
    response = await attempt()
  }

  const research  = response.text ?? ''
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

  return { research, sources }
}
