// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/_lib/gemini.ts
// Thin wrapper around Google Generative AI (Gemini).
// Validates Gemini's JSON output with a Zod schema; retries once on failure.
// NEVER called from the browser — server-side only.
// The user's API key is per-request (BYOK from the `x-gemini-api-key` header).
// ---------------------------------------------------------------------------

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { z } from 'zod'

const DEFAULT_MODEL = 'gemini-2.5-flash'

// ---------------------------------------------------------------------------
// Hebrew output instruction (preserved from the Claude wrapper)
// ---------------------------------------------------------------------------

export const HEBREW_SYSTEM_SUFFIX = `

Output language: Respond in modern professional Hebrew (עברית מקצועית). Follow these rules for code-switching:
— Use English for: programming language and tool names (SQL, Python, JavaScript, React, TypeScript, etc.), technical concepts commonly used in English in Israeli tech (REST, OAuth, KPI, OKR, A/B test, ETL, ML, AI, CRM, API, SaaS, CI/CD), proper nouns (company names, product names, frameworks), and any acronyms.
— Do NOT transliterate technical terms; embed the English term directly in the Hebrew sentence (e.g., "הפרויקט בנוי ב-React עם TypeScript").
— Use right-to-left punctuation conventions but keep numbers in Western Arabic numerals (1, 2, 3, not א, ב, ג).
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
// Raw text call (used by /api/ai/_test)
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
}

export async function callGeminiRaw(opts: CallGeminiRawOptions): Promise<string> {
  const genAI = new GoogleGenerativeAI(opts.apiKey)
  const model = genAI.getGenerativeModel({
    model:              opts.model ?? DEFAULT_MODEL,
    systemInstruction:  opts.system,
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens:  opts.maxTokens ?? 2048,
    },
  })
  const contents = opts.userParts
    ? [{ role: 'user' as const, parts: opts.userParts }]
    : opts.user ?? ''
  const result = await model.generateContent(contents)
  return result.response.text()
}

// ---------------------------------------------------------------------------
// JSON + schema-validated call (used by every domain function)
// Retries exactly once if the output fails schema validation.
// ---------------------------------------------------------------------------

export interface CallGeminiOptions<T> {
  apiKey:    string
  system:    string
  /** Plain text user message. Mutually exclusive with `userParts`. */
  user?:     string
  /** Multimodal user message. Mutually exclusive with `user`. */
  userParts?: GeminiPart[]
  schema:    z.ZodType<T>
  maxTokens: number
  model?:    string
}

export async function callGemini<T>(opts: CallGeminiOptions<T>): Promise<T> {
  const firstText = await callGeminiRaw(opts)
  const firstJson = parseJSON(firstText)
  const firstResult = opts.schema.safeParse(firstJson)
  if (firstResult.success) return firstResult.data

  // Retry once with a correction turn. The retry is always text-only — we
  // include the original request summary in the retry prompt rather than
  // re-uploading the inline binary.
  const issues = firstResult.error.issues
    .map(i => `• ${i.path.join('.')}: ${i.message}`)
    .join('\n')

  const originalSummary = opts.user ?? '(multimodal input — see previous output)'

  const retryUser =
    `Your previous JSON output failed validation. Fix these issues and return ONLY the corrected JSON object.\n\nIssues:\n${issues}\n\nPrevious output:\n${firstText}\n\nOriginal request:\n${originalSummary}`

  const retryText = await callGeminiRaw({
    apiKey:    opts.apiKey,
    system:    opts.system,
    user:      retryUser,
    maxTokens: opts.maxTokens,
    model:     opts.model,
  })
  const retryJson = parseJSON(retryText)
  const retryResult = opts.schema.safeParse(retryJson)
  if (retryResult.success) return retryResult.data

  const retryIssues = retryResult.error.issues
    .map(i => `${i.path.join('.')}: ${i.message}`)
    .join('; ')
  throw new Error(`Gemini output failed validation after retry: ${retryIssues}`)
}

// ---------------------------------------------------------------------------
// JSON parser — Gemini with responseMimeType=application/json normally returns
// clean JSON, but be defensive (markdown fences, stray prose).
// ---------------------------------------------------------------------------

function parseJSON(text: string): unknown {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  try {
    return JSON.parse(stripped)
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) } catch { /* fall through */ }
    }
    throw new Error(`Gemini response is not valid JSON: ${stripped.slice(0, 200)}`)
  }
}
