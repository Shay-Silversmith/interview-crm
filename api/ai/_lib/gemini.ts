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
  // A multimodal turn must be wrapped as a GenerateContentRequest; a bare
  // array of Content objects is not one of the accepted overloads.
  const contents = opts.userParts
    ? { contents: [{ role: 'user' as const, parts: opts.userParts }] }
    : (opts.user ?? '')
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

// ---------------------------------------------------------------------------
// Grounded call — answers from Google Search rather than training data.
//
// The Gemini API refuses responseMimeType='application/json' together with the
// search tool, which is why the original port dropped grounding entirely and
// left company research to the model's memory. The way through is to ask for
// JSON in the prompt instead of enforcing it in the config, then parse it out
// of the reply — parseJSON already copes with fences and stray prose.
//
// If the grounded reply will not validate, the retry runs UNGROUNDED in strict
// JSON mode over the grounded text. That keeps the researched facts and only
// repairs the shape, instead of throwing the research away.
// ---------------------------------------------------------------------------

export interface GroundingSource {
  title?: string
  uri?:   string
}

export interface GroundedResult<T> {
  data:    T
  sources: GroundingSource[]
}

export async function callGeminiGrounded<T>(opts: CallGeminiOptions<T>): Promise<GroundedResult<T>> {
  const genAI = new GoogleGenerativeAI(opts.apiKey)
  const model = genAI.getGenerativeModel({
    model:             opts.model ?? DEFAULT_MODEL,
    systemInstruction: opts.system,
    // Cast: the installed SDK's Tool union predates the 2.x googleSearch tool.
    tools:             [{ googleSearch: {} }] as unknown as Parameters<typeof genAI.getGenerativeModel>[0]['tools'],
    generationConfig:  { maxOutputTokens: opts.maxTokens },
  })

  const result = await model.generateContent(opts.user ?? '')
  const text   = result.response.text()

  const candidate = result.response.candidates?.[0] as unknown as {
    groundingMetadata?: { groundingChunks?: { web?: { title?: string; uri?: string } }[] }
  } | undefined

  const sources: GroundingSource[] = (candidate?.groundingMetadata?.groundingChunks ?? [])
    .map(c => ({ title: c.web?.title, uri: c.web?.uri }))
    .filter(sourceEntry => !!sourceEntry.uri)

  const parsed = opts.schema.safeParse(parseJSON(text))
  if (parsed.success) return { data: parsed.data, sources }

  const issues = parsed.error.issues.map(i => `• ${i.path.join('.')}: ${i.message}`).join('\n')
  const repaired = await callGemini({
    apiKey:    opts.apiKey,
    system:    opts.system,
    user:      `Reformat the research below into the required JSON object. Do not add facts that are not present in it.\n\nValidation issues to fix:\n${issues}\n\nResearch:\n${text}`,
    schema:    opts.schema,
    maxTokens: opts.maxTokens,
    model:     opts.model,
  })
  return { data: repaired, sources }
}
