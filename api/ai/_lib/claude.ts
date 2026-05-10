// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/_lib/claude.ts
// Thin wrapper around the Anthropic SDK.
// Validates Claude's JSON output with a Zod schema; retries once on failure.
// NEVER called from the browser — server-side only.
// ---------------------------------------------------------------------------

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const MODEL = 'claude-sonnet-4-6'

// Lazy-initialize so the module can be imported without the key set
// (useful in test environments — the key is always present at call-time).
let _client: Anthropic | null = null
function client(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    _client = new Anthropic({ apiKey: key })
  }
  return _client
}

// ---------------------------------------------------------------------------
// Hebrew output instruction
// ---------------------------------------------------------------------------

/**
 * Appended to the system prompt when the client requests Hebrew output.
 * Technical terms, frameworks, and proper nouns stay in English so that
 * the text reads naturally in Israeli tech writing.
 */
export const HEBREW_SYSTEM_SUFFIX = `

Output language: Respond in modern professional Hebrew (עברית מקצועית). Follow these rules for code-switching:
— Use English for: programming language and tool names (SQL, Python, JavaScript, React, TypeScript, etc.), technical concepts commonly used in English in Israeli tech (REST, OAuth, KPI, OKR, A/B test, ETL, ML, AI, CRM, API, SaaS, CI/CD), proper nouns (company names, product names, frameworks), and any acronyms.
— Do NOT transliterate technical terms; embed the English term directly in the Hebrew sentence (e.g., "הפרויקט בנוי ב-React עם TypeScript").
— Use right-to-left punctuation conventions but keep numbers in Western Arabic numerals (1, 2, 3, not א, ב, ג).
— The JSON structure and all keys must remain exactly as specified above. Only the string values change language.`

/**
 * Returns the Hebrew suffix if locale is 'he', otherwise empty string.
 */
export function localeSystemSuffix(locale?: string | null): string {
  return locale === 'he' ? HEBREW_SYSTEM_SUFFIX : ''
}

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface CallClaudeOptions<T> {
  system: string
  user: string
  schema: z.ZodType<T>
  maxTokens: number
}

/**
 * Call Claude and parse/validate the response as JSON.
 * Retries exactly once if the output fails schema validation.
 */
export async function callClaude<T>({
  system,
  user,
  schema,
  maxTokens,
}: CallClaudeOptions<T>): Promise<T> {
  type Msg = Anthropic.MessageParam

  const firstMessages: Msg[] = [{ role: 'user', content: user }]

  const firstReply = await client().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: firstMessages,
  })

  const firstText = extractText(firstReply)
  const firstJson = parseJSON(firstText)
  const firstResult = schema.safeParse(firstJson)

  if (firstResult.success) return firstResult.data

  // --- Retry with a correction turn ---
  const issuesSummary = firstResult.error.issues
    .map(i => `• ${i.path.join('.')}: ${i.message}`)
    .join('\n')

  const fixPrompt =
    `Your JSON output failed validation. Fix these issues and return ONLY the corrected JSON object:\n${issuesSummary}`

  const retryMessages: Msg[] = [
    ...firstMessages,
    { role: 'assistant', content: firstText },
    { role: 'user', content: fixPrompt },
  ]

  const retryReply = await client().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: retryMessages,
  })

  const retryText = extractText(retryReply)
  const retryJson = parseJSON(retryText)
  const retryResult = schema.safeParse(retryJson)

  if (retryResult.success) return retryResult.data

  const retryIssues = retryResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
  throw new Error(`Claude output failed validation after retry: ${retryIssues}`)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractText(response: Anthropic.Message): string {
  const block = response.content.find(b => b.type === 'text')
  if (!block || block.type !== 'text') throw new Error('Claude returned no text content')
  return block.text.trim()
}

function parseJSON(text: string): unknown {
  // Strip markdown code fences if Claude wrapped the JSON
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  try {
    return JSON.parse(stripped)
  } catch {
    // Fall back: grab the first {...} block
    const match = stripped.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch { /* fall through */ }
    }
    throw new Error(`Claude response is not valid JSON: ${stripped.slice(0, 200)}`)
  }
}
