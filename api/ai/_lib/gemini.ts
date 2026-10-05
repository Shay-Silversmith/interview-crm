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
import { webSearch, renderSearchContext, fetchPageText } from './search.js'
import type { SearchHit } from './search.js'
import { callGroq, isGroqConfigured } from './groq.js'

/**
 * Off the 2.5 line, because new keys cannot reach it at all.
 *
 * A key issued today answers every gemini-2.5-flash request with
 * 404 NOT_FOUND: "no longer available to new users … use models/
 * gemini-3.6-flash". The model still appears in ListModels, which is why this
 * looked like a quota problem for so long: the listing is generic, the
 * entitlement is not.
 *
 * The cost was not just the failure. isModelUnavailable() caught that 404 and
 * retried on the fallback, so every single call spent two requests — and for a
 * grounded call the fallback landed on a model with no free grounding, turning
 * a clear "this model is gone" into the opaque 429 the UI was reporting.
 *
 * gemini-3.5-flash rather than a newer one because newer is not more
 * available: on a free key 3.7 and 3.8 — what the 404 now recommends — returned
 * 503 "high demand" on every try, while 3.5 and 3.6 answered most of the time.
 * Most, not all; see OVERLOAD_CHAIN for what happens the rest of the time.
 */
export const DEFAULT_MODEL = 'gemini-3.5-flash'

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
  // The 2.5 family is withdrawn from accounts created after its retirement, so
  // it is only ever a source here, never a destination. Pointing anything back
  // at it — as the old map did — sends a working key to a guaranteed 404.
  'gemini-2.5-flash-lite': 'gemini-3.5-flash-lite',
  'gemini-2.5-flash':      'gemini-3.6-flash',
  'gemini-2.5-pro':        'gemini-3.5-pro',
  // Within the 3.x line, fall forward to the next model that is still served.
  'gemini-3.5-flash-lite': 'gemini-3.1-flash-lite',
  'gemini-3.5-flash':      'gemini-3.6-flash',
  'gemini-3.6-flash':      'gemini-3.5-flash',
  'gemini-3.5-pro':        'gemini-3.1-pro-preview',
}

/**
 * True for a rejected request parameter, as opposed to a rejected key.
 *
 * Google returns INVALID_ARGUMENT for both, and the key case has a recognisable
 * message; everything else is a config the model would not accept.
 */
function isInvalidArgument(err: unknown): boolean {
  const raw = (err instanceof Error ? err.message : String(err)).toLowerCase()
  if (/api[_ ]?key/.test(raw)) return false
  return raw.includes('invalid_argument') || raw.includes('invalid argument')
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
 * True when the model exists but is not answering right now.
 *
 * Google sheds load per model — "This model is currently experiencing high
 * demand" on one while its neighbour answers in a second — and on the free tier
 * it does so often enough that a single 503 used to take down a whole tool.
 * A dropped connection is treated the same way: both mean "ask again".
 */
function isOverloaded(err: unknown): boolean {
  const raw = (err instanceof Error ? err.message : String(err)).toLowerCase()
  return (
    raw.includes('"code":503') ||
    raw.includes('unavailable') ||
    raw.includes('overloaded') ||
    raw.includes('high demand') ||
    raw.includes('fetch failed')
  )
}

/**
 * Who to ask when a model is overloaded or out of quota, in order.
 *
 * The two flash models go down independently, and both together often enough
 * that one alternative is not sufficient — measured: 3.5-flash and 3.6-flash
 * refused the same request seconds apart while flash-lite answered in under a
 * second throughout. So the chain ends on the lite models: a slightly plainer
 * answer beats "try again later" from a tool the user just clicked.
 */
const OVERLOAD_CHAIN = [
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
]

/**
 * True when this model's allowance is spent, as opposed to the request being
 * wrong.
 *
 * The free tier meters each model separately — the 429 names the model in its
 * quota dimensions, and the limit on gemini-3.5-flash is 20 requests a day.
 * Twenty. One research tool spends two or three, so an ordinary session runs
 * through it by mid-morning, while the other three models in the chain sit
 * untouched with allowances of their own. Treating that 429 as final was
 * reporting "out of quota" with three quarters of the quota unused.
 *
 * Empty prepaid credit is the exception: it is the billing account that is
 * empty, not a model, so every model will say the same thing.
 */
function isQuotaSpent(err: unknown): boolean {
  const raw = (err instanceof Error ? err.message : String(err)).toLowerCase()
  if (raw.includes('prepayment credits are depleted')) return false
  return raw.includes('"code":429') || raw.includes('resource_exhausted')
}

/** Reasons to ask a different model the same question. */
function shouldTryNextModel(err: unknown): boolean {
  return isOverloaded(err) || isQuotaSpent(err)
}

/**
 * Models known to be out of quota, and until when.
 *
 * Without this, every call after the daily limit is reached would begin by
 * asking the spent model again and waiting for its refusal. Google says how
 * long the refusal lasts (RetryInfo.retryDelay — seconds for a per-minute
 * limit, hours for a daily one), so it is remembered and the model skipped
 * until then. In memory only: a cold start forgets it, and relearns it for the
 * price of one fast 429.
 */
const spentUntil = new Map<string, number>()

function spentKey(apiKey: string, model: string): string {
  return `${apiKey.slice(-8)}:${model}`
}

function rememberSpent(apiKey: string, model: string, err: unknown): void {
  if (!isQuotaSpent(err)) return
  const raw   = err instanceof Error ? err.message : String(err)
  const delay = Number(raw.match(/"retryDelay"\s*:\s*"(\d+)(?:\.\d+)?s"/)?.[1] ?? NaN)
  // No delay stated: assume the short limit, so a guess never benches a model for hours.
  const ms = (Number.isFinite(delay) ? Math.min(delay, 6 * 3600) : 60) * 1000
  spentUntil.set(spentKey(apiKey, model), Date.now() + ms)
}

function isKnownSpent(apiKey: string, model: string): boolean {
  const until = spentUntil.get(spentKey(apiKey, model))
  if (!until) return false
  if (until > Date.now()) return true
  spentUntil.delete(spentKey(apiKey, model))
  return false
}

/** The request as the given model will accept it. */
function paramsFor<P extends { model: string; config: unknown }>(params: P, model: string): P {
  if (!rejectsThinkingConfig(model)) return { ...params, model }
  const { thinkingConfig: _dropped, ...config } = (params.config ?? {}) as Record<string, unknown>
  return { ...params, model, config }
}

/**
 * Sends a request, moving to another model if this one has been retired, is
 * overloaded, or is out of quota. Every call in this file goes through here so
 * the fallback applies uniformly, including the research path.
 */
async function generateWithFallback(
  ai: GoogleGenAI,
  apiKey: string,
  params: { model: string; contents: unknown; config: unknown },
): Promise<Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>> {
  type GenParams = Parameters<GoogleGenAI['models']['generateContent']>[0]
  const send = (model: string) =>
    ai.models.generateContent(paramsFor(params, model) as unknown as GenParams)

  // The requested model first, then the rest of the chain. Models already
  // known to be spent go to the back rather than out: if everything is spent,
  // one of them still has to be asked so there is a real error to report.
  const order   = [params.model, ...OVERLOAD_CHAIN.filter(m => m !== params.model)]
  const fresh   = order.filter(m => !isKnownSpent(apiKey, m))
  const queue   = fresh.length > 0 ? fresh : [params.model]

  let firstError: unknown
  for (let i = 0; i < queue.length; i++) {
    let model = queue[i]
    try {
      return await send(model)
    } catch (err) {
      let failure = err

      // Retired: its named successor, once, before moving along the chain.
      const successor = MODEL_FALLBACKS[model]
      if (isModelUnavailable(err) && successor && !queue.includes(successor)) {
        console.warn(`[gemini] ${model} unavailable, retrying on ${successor}`)
        model = successor
        try {
          return await send(model)
        } catch (retired) {
          failure = retired
        }
      }

      firstError ??= failure
      rememberSpent(apiKey, model, failure)

      // Anything other than "not available right now" is a real answer about
      // the request or the key, and is reported as such.
      if (!shouldTryNextModel(failure) && !isModelUnavailable(failure)) throw failure
      if (i < queue.length - 1) {
        console.warn(`[gemini] ${model} ${isQuotaSpent(failure) ? 'out of quota' : 'not answering'}, trying ${queue[i + 1]}`)
      }
    }
  }
  throw firstError
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
/**
 * True for a model that refuses thinkingConfig outright.
 *
 * gemini-3.5-flash-lite answers 400 INVALID_ARGUMENT to `thinkingBudget: 0`,
 * and the generic INVALID_ARGUMENT retry below recovers from it — at the price
 * of a wasted request on every structuring call, which on a free tier measured
 * in requests is half the budget of a research run. Skip the argument for the
 * family that will not take it rather than paying to rediscover it each time.
 */
function rejectsThinkingConfig(model: string): boolean {
  return model.includes('flash-lite')
}

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

/**
 * Errors this codebase raises itself, which already say what they mean.
 *
 * Running them through Gemini's error grammar garbles them: SearchUnavailable
 * names the env vars to set, one of which ends in _API_KEY, and the key-rejected
 * rule below matched it — so a missing search provider was reported to the user
 * as a bad Gemini key, sending them to fix the one thing that was fine.
 */
const OWN_ERRORS = new Set([
  'SearchUnavailableError',
  'SearchFailedError',
  'GeminiTruncatedError',
  'GeminiEmptyError',
])

export function describeGeminiError(err: unknown): string {
  if (err instanceof Error && OWN_ERRORS.has(err.name)) return err.message

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

        if (inner.status === 'INVALID_ARGUMENT') {
          // "Request contains an invalid argument" on its own names nothing.
          // Google puts the offending field in BadRequest.fieldViolations, so
          // pull it out — otherwise this error is impossible to act on.
          const rawArg = JSON.stringify(body)
          const field  = rawArg.match(/"field"\s*:\s*"([^"]+)"/)?.[1]
          const why    = rawArg.match(/"description"\s*:\s*"([^"]+)"/)?.[1]
          const detail = field || why
            ? ` Google objected to${field ? ` "${field}"` : ''}${why ? `: ${why}` : ''}`
            : ''
          return `Gemini rejected the request as malformed.${detail} (${inner.message})`
        }
        // A paid project out of prepaid credit also comes back as 429, but no
        // amount of waiting fixes it — calling it a quota reads as "try later".
        if (/prepayment credits are depleted/i.test(inner.message))
          return 'The Google project behind this Gemini key has run out of prepaid credit, so every AI request is refused until it is topped up. Add credit at https://aistudio.google.com (Billing), or create a new key in a project without billing to go back to the free tier, then update it in Settings.'

        if (inner.code === 429 || inner.status === 'RESOURCE_EXHAUSTED') {
          // Per-day and per-minute call for opposite responses — one means wait
          // a minute, the other means wait for the reset — and reporting the
          // wrong one sends people to the wrong conclusion. Read it out of the
          // payload rather than guessing:
          //   RetryInfo.retryDelay is seconds for a per-minute limit and hours
          //   for a daily one, so it settles the question on its own.
          //   QuotaFailure.violations names the metric and the limit value.
          const raw429 = JSON.stringify(body)

          const delaySec = Number(raw429.match(/"retryDelay"\s*:\s*"(\d+)s"/)?.[1] ?? NaN)
          const quotaId  = raw429.match(/"quotaId"\s*:\s*"([^"]+)"/)?.[1] ?? ''
          const metric   = raw429.match(/"quotaMetric"\s*:\s*"([^"]+)"/)?.[1] ?? ''
          const limit    = raw429.match(/"quotaValue"\s*:\s*"?(\d+)/)?.[1] ?? ''

          const haystack = `${quotaId} ${metric}`
          const perDay = /PerDay|RequestsPerDay/i.test(haystack) ||
                         (Number.isFinite(delaySec) && delaySec > 300)
          const perMin = /PerMinute|RequestsPerMinute/i.test(haystack) ||
                         (Number.isFinite(delaySec) && delaySec <= 300)

          // No QuotaFailure block at all is a different animal from a spent
          // allowance: it means the allowance for this model or feature on this
          // tier is ZERO. Two things cause it, and "unspecified limit, check
          // your quota in AI Studio" sent people looking for neither.
          const which = perDay ? 'daily' : perMin ? 'per-minute' : 'no allowance at all'
          const wait  = Number.isFinite(delaySec)
            ? delaySec <= 300
              ? ` Google says to retry in about ${delaySec} seconds.`
              : ` Google says to retry in about ${Math.round(delaySec / 3600)} hours.`
            : ''
          const detail = limit ? ` The limit hit was ${limit}${metric ? ` on ${metric}` : ''}.` : ''

          return (
            `Gemini quota exceeded (${which} limit).${wait}${detail} ` +
            (perDay
              ? 'The daily allowance for this key is spent; it resets at midnight Pacific time.'
              : perMin
                ? 'This is the per-minute limit, not the daily one — the tools fire several requests per run, which trips it easily. Waiting a minute is usually enough.'
                : 'Google reported no limit details, which means this key has no allowance ' +
                  'for this model or feature rather than a spent one. The two usual causes: ' +
                  'the key lives in a Google Cloud project with a billing account attached, ' +
                  'so it is billed rather than free and the balance is empty; or the feature ' +
                  'is not offered on the free tier (Google Search grounding is free only on ' +
                  'gemini-2.5-flash). Check which tier this key is on at ' +
                  'https://aistudio.google.com/rate-limit — if it is not Free, make a new key ' +
                  'in a NEW project with no billing account.') +
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
  /** Set true to report Gemini's failure as-is. The key test needs the truth. */
  noBackup?:  boolean
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

/**
 * True when Gemini itself is the problem — overloaded, retired, out of quota,
 * unreachable, or silent — rather than the request or the key.
 *
 * A rejected key or a malformed request is excluded on purpose. Those are for
 * the user to fix, and answering them from the deployment's backup key would
 * hide the fault and let anyone run the tools on that key with no key of
 * their own.
 */
function isGeminiDown(err: unknown): boolean {
  if (err instanceof GeminiEmptyError) return true
  if (isInvalidArgument(err)) return false
  const raw = (err instanceof Error ? err.message : String(err)).toLowerCase()
  if (/api[_ ]?key/.test(raw)) return false
  return (
    isOverloaded(err) ||
    isModelUnavailable(err) ||
    raw.includes('"code":429') ||
    raw.includes('resource_exhausted') ||
    raw.includes('quota')
  )
}

/**
 * Asks Gemini, and if Gemini is down, asks the backup.
 *
 * The backup is strictly second: it runs only after the whole Gemini fallback
 * chain has failed, only when the deployment has a Groq key, and only for
 * text — a CV sent as a PDF has nowhere to go on a text-only model. If the
 * backup fails too, Gemini's error is the one reported, since that is the
 * fault the user can see and act on.
 */
export async function callGeminiRaw(opts: CallGeminiRawOptions): Promise<string> {
  try {
    return await callGeminiOnly(opts)
  } catch (err) {
    const textOnly = !opts.userParts || opts.userParts.every(p => 'text' in p)
    if (opts.noBackup || !textOnly || !isGroqConfigured() || !isGeminiDown(err)) throw err

    console.warn('[gemini] failed, using the Groq backup:',
      err instanceof Error ? err.message.slice(0, 200) : err)
    try {
      return await callGroq({
        system:    opts.system,
        user:      opts.userParts
          ? opts.userParts.map(p => ('text' in p ? p.text : '')).join('\n\n')
          : opts.user ?? '',
        maxTokens: opts.maxTokens,
        json:      opts.json,
      })
    } catch (backupErr) {
      console.warn('[groq] backup failed too:',
        backupErr instanceof Error ? backupErr.message : backupErr)
      throw err
    }
  }
}

async function callGeminiOnly(opts: CallGeminiRawOptions): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey })

  const contents = opts.userParts
    ? [{ role: 'user' as const, parts: opts.userParts }]
    : [{ role: 'user' as const, parts: [{ text: opts.user ?? '' }] }]

  const model = opts.model ?? DEFAULT_MODEL

  const baseConfig = {
    systemInstruction: opts.system,
    maxOutputTokens:   opts.maxTokens ?? 8192,
    ...(opts.json === false ? {} : { responseMimeType: 'application/json' }),
  }

  const config = rejectsThinkingConfig(model)
    ? baseConfig
    : { ...baseConfig, thinkingConfig: { thinkingBudget: opts.thinkingBudget ?? NO_THINKING } }

  let response
  try {
    response = await generateWithFallback(ai, opts.apiKey, { model, contents, config })
  } catch (err) {
    // Which models accept thinkingBudget — and which accept 0 to disable it —
    // varies by model and changes as models are replaced. A rejected budget
    // comes back as a bare "Request contains an invalid argument", which says
    // nothing about which argument, and took down the structuring pass the
    // moment it moved to a lighter model. The budget is an optimisation, not a
    // requirement, so drop it and let the model choose rather than fail.
    if (!isInvalidArgument(err)) throw err
    console.warn(`[gemini] ${model} rejected thinkingConfig; retrying without it`)
    response = await generateWithFallback(ai, opts.apiKey, { model, contents, config: baseConfig })
  }

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
  /** Fetch these pages directly and hand their text to the model. */
  urls?: string[]
  /**
   * What to search for. A route knows what it is researching — a company name,
   * a role at a company — far better than this file can recover from the
   * prompt it was handed, so it says so. Omitted, queries are derived from the
   * user message, which works but searches worse.
   */
  searchQueries?: string[]
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

/**
 * Derives search queries from the prompt when a route did not supply any.
 *
 * Route prompts are written as labelled lines — "Company: Wix", "Role: PM" —
 * so the values carry the search terms and the labels are noise. This is a
 * fallback: a route that passes searchQueries gets better results.
 */
function deriveQueries(user: string): string[] {
  const values = user
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.length < 200)
    .map(line => {
      const m = line.match(/^[A-Za-z][A-Za-z .\/-]{0,40}:\s*(.+)$/)
      return (m ? m[1] : line).trim()
    })
    .filter(v => v.length > 2 && !v.startsWith('http'))

  const joined = values.slice(0, 2).join(' ')
  return joined ? [joined] : [user.slice(0, 120)]
}

/**
 * Searches the web, reads any pages named outright, and asks the model to
 * write up what it found.
 *
 * This used to hand Gemini its own `googleSearch` tool and let it do both
 * halves. That path is gone — see the header of search.ts for the measurements
 * — so the search happens first, in this process, and the model receives the
 * results as ordinary prompt text. The model no longer chooses what to look
 * up, which loses a little; it also can no longer come back empty-handed
 * because a tool was refused, which gains rather more.
 */
async function runResearch(
  opts: Omit<CallGeminiGroundedOptions<unknown>, 'schema'>,
): Promise<{ research: string; sources: GroundingSource[] }> {
  // A URL the user pasted is the primary document, not one result among many,
  // so it is fetched first and placed ahead of the search results.
  const pages = await Promise.all(
    (opts.urls ?? []).slice(0, 3).map(async url => ({ url, text: await fetchPageText(url) })),
  )
  const readable   = pages.filter(p => p.text.length > 200)
  const unreadable = pages.filter(p => p.text.length <= 200).map(p => p.url)

  const queries = opts.searchQueries?.length
    ? opts.searchQueries
    : deriveQueries(opts.user ?? '')

  // Search is the only source for a company name, but for a pasted job link it
  // is a supplement to a page we already hold. So a search that is unconfigured
  // or refused is fatal only when there is nothing else to read — otherwise the
  // posting alone answers the question, which is what the user asked for.
  let hits: SearchHit[] = []
  let provider = ''
  try {
    const found = await webSearch(queries)
    hits = found.hits
    provider = found.provider
  } catch (err) {
    if (readable.length === 0) throw err
    console.warn('[gemini] search unavailable; continuing on fetched page text alone:',
      err instanceof Error ? err.message : err)
  }

  const researchSystem =
    `${opts.system}\n\n` +
    'IMPORTANT OVERRIDE FOR THIS STEP: do NOT return JSON. Using only the SEARCH RESULTS ' +
    'and PAGE CONTENT supplied in the user message, write your findings as plain prose ' +
    'notes under short headings — one heading per field named above, in the same order, ' +
    'using the field name as the heading. Include every fact you would have put in each ' +
    'field, and keep the length caps described above. A separate step converts your notes ' +
    'into JSON, so formatting does not matter here; completeness and accuracy do. ' +
    'Do not state anything the supplied material does not support: if it does not cover a ' +
    'field, say so under that heading rather than filling it from memory.'

  const parts: string[] = [opts.user ?? '']

  if (readable.length > 0) {
    parts.push(
      'PAGE CONTENT (fetched directly from the links given above):\n\n' +
      readable.map(p => `--- ${p.url} ---\n${p.text}`).join('\n\n'),
    )
  }
  if (unreadable.length > 0) {
    parts.push(
      'THESE LINKS COULD NOT BE READ (expired, blocked, or login-walled). Say so rather ' +
      `than describing them: ${unreadable.join(', ')}`,
    )
  }

  if (hits.length > 0) {
    parts.push(`SEARCH RESULTS (from ${provider}):\n\n${renderSearchContext(hits)}`)
  }

  const research = await callGeminiRaw({
    apiKey:    opts.apiKey,
    system:    researchSystem,
    user:      parts.join('\n\n'),
    model:     opts.model,
    // Prose, not JSON — the structuring pass turns it into the schema.
    json:      false,
    maxTokens: 16_000,
    // The model is reasoning over a dozen sources; a fixed small budget is
    // what used to leave these calls finishing with nothing written.
    thinkingBudget: DYNAMIC_THINKING,
  })

  const seen = new Set<string>()
  const sources: GroundingSource[] = hits
    .filter(h => {
      if (!h.url || seen.has(h.url)) return false
      seen.add(h.url)
      return true
    })
    .map(h => ({ title: h.title, uri: h.url }))

  return { research, sources }
}
