// ---------------------------------------------------------------------------
// InterviewFlow — scripts/diagnose-gemini.mjs
//
// Answers one question with evidence instead of guesswork: which call shapes
// does this Gemini key actually return text for — and when it refuses, which
// quota did it refuse against?
//
// That second half matters because Google's 429 ("You exceeded your current
// quota, please check your plan and billing details") names nothing on its own.
// What identifies the limit lives in the QuotaFailure and RetryInfo blocks of
// the error payload, and those are what this prints.
//
// Run:
//   node scripts/diagnose-gemini.mjs            # compare call shapes on one model
//   node scripts/diagnose-gemini.mjs --app      # the exact calls the app makes
//   node scripts/diagnose-gemini.mjs --models   # list the models this key can call
//
// The key is read from the environment and never printed. Set it for the one
// command, or put GEMINI_API_KEY in .env.local (which is git-ignored).
// ---------------------------------------------------------------------------

import fs from 'node:fs'
import path from 'node:path'
import { GoogleGenAI } from '@google/genai'

// --- key -------------------------------------------------------------------

function readKey() {
  if (process.env.GEMINI_API_KEY?.trim()) return process.env.GEMINI_API_KEY.trim()

  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const line = fs.readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .find(l => l.startsWith('GEMINI_API_KEY='))
    if (line) return line.slice('GEMINI_API_KEY='.length).trim().replace(/^["']|["']$/g, '')
  }
  return null
}

const apiKey = readKey()
if (!apiKey) {
  console.error(
    'No key found.\n\n' +
    'Add this line to .env.local (it is git-ignored, and the key is never printed):\n' +
    '  GEMINI_API_KEY=your-key-here\n\n' +
    'Then run: node scripts/diagnose-gemini.mjs',
  )
  process.exit(1)
}

const ai = new GoogleGenAI({ apiKey })

// --- error reporting -------------------------------------------------------
//
// The SDK throws an Error whose message is a JSON blob, and printing the first
// 400 characters of it showed the useless half: the human sentence, and none of
// the machine detail. Google puts the identity of the limit in
// google.rpc.QuotaFailure (quotaMetric, quotaValue, quotaId) and the wait in
// google.rpc.RetryInfo (retryDelay) — seconds for a per-minute limit, hours for
// a daily one. Those decide what to do next, so print them first.

// Two key formats are in circulation: the long-standing AIza… and the newer
// AQ.… that AI Studio now issues. Redact both — this output gets pasted.
const redact = s => String(s)
  .replace(/AIza[0-9A-Za-z_-]{10,}/g, '[redacted]')
  .replace(/AQ.[0-9A-Za-z_-]{10,}/g, '[redacted]')

function reportError(err) {
  const raw  = redact(err instanceof Error ? err.message : String(err))
  const json = raw.match(/\{[\s\S]*\}/)

  let body = null
  if (json) { try { body = JSON.parse(json[0]) } catch { /* not JSON after all */ } }

  const inner = body?.error
  if (!inner) {
    console.log('   ' + raw.slice(0, 600))
    return
  }

  console.log(`   code         : ${inner.code ?? '?'}  ${inner.status ?? ''}`)
  console.log(`   message      : ${redact(inner.message ?? '')}`)

  const details = Array.isArray(inner.details) ? inner.details : []

  const quota = details.find(d => String(d['@type'] ?? '').includes('QuotaFailure'))
  if (quota) {
    for (const v of quota.violations ?? []) {
      console.log(`   quota hit    : ${v.quotaMetric ?? '(unnamed metric)'}`)
      console.log(`     quotaId    : ${v.quotaId ?? '(none)'}`)
      console.log(`     limit      : ${v.quotaValue ?? '(none)'}`)
      if (v.quotaDimensions) console.log(`     dimensions : ${JSON.stringify(v.quotaDimensions)}`)
    }
  } else if (inner.code === 429) {
    // A quota of ZERO — a feature not offered on this tier at all, such as
    // Google Search grounding on a Gemini 3.x free key — comes back as a bare
    // 429 with no QuotaFailure block. The absence is itself the diagnosis.
    console.log('   quota hit    : (no QuotaFailure block — that usually means the allowance')
    console.log('                  for this model or feature on this tier is zero, rather')
    console.log('                  than that a non-zero allowance ran out)')
  }

  const retry = details.find(d => String(d['@type'] ?? '').includes('RetryInfo'))
  if (retry?.retryDelay) console.log(`   retry after  : ${retry.retryDelay}`)

  const help = details.find(d => String(d['@type'] ?? '').includes('Help'))
  for (const link of help?.links ?? []) console.log(`   help         : ${link.url}`)
}

// --- model listing ---------------------------------------------------------
//
// Which models a key can reach is account-specific and changes without notice:
// Google withdraws older ones from newer accounts, so a name that is correct in
// the docs can be refused here. Listing costs no generation quota and settles
// the question that guessing at names kept reopening.
//
//   node scripts/diagnose-gemini.mjs --models
//
if (process.argv.includes('--models')) {
  const usable = []
  for await (const m of await ai.models.list()) {
    const actions = m.supportedActions ?? m.supportedGenerationMethods ?? []
    if (actions.length === 0 || actions.includes('generateContent')) usable.push(m.name)
  }
  console.log('Models this key can call with generateContent:\n')
  for (const name of usable.sort()) console.log('  ' + name.replace(/^models\//, ''))
  console.log('\nPaste this back. It contains no key material.')
  process.exit(0)
}

const MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash'

const SYSTEM_JSON = `\
You research companies. Return a single JSON object with exactly these keys:
{
  "headline":   "one sentence",
  "whatTheyDo": "3-4 sentences",
  "products":   ["max 5"],
  "scale":      "1-2 sentences"
}
Return ONLY the JSON object, no prose and no markdown fences.`

const SYSTEM_PROSE = `\
You research companies. Write plain prose notes under short headings covering:
headline, whatTheyDo, products, scale. Do NOT return JSON.`

const USER = 'Company to research: Deloitte. The candidate is interviewing for: Product Owner.'

// --- cases -----------------------------------------------------------------

const SHAPE_CASES = [
  {
    name: '1. grounded + JSON demanded in prompt  (what was failing)',
    config: {
      systemInstruction: SYSTEM_JSON,
      maxOutputTokens:   9000,
      thinkingConfig:    { thinkingBudget: -1 },
      tools:             [{ googleSearch: {} }],
    },
  },
  {
    name: '2. grounded + prose, no limits         (the new approach)',
    config: {
      systemInstruction: SYSTEM_PROSE,
      tools:             [{ googleSearch: {} }],
    },
  },
  {
    name: '3. grounded + prose + token ceiling',
    config: {
      systemInstruction: SYSTEM_PROSE,
      maxOutputTokens:   9000,
      tools:             [{ googleSearch: {} }],
    },
  },
  {
    name: '4. ungrounded + real JSON mode         (the structuring pass)',
    config: {
      systemInstruction: SYSTEM_JSON,
      maxOutputTokens:   9000,
      responseMimeType:  'application/json',
      thinkingConfig:    { thinkingBudget: 0 },
    },
  },
]

// --- app mode --------------------------------------------------------------
//
// One "Auto-fill with AI" click is not one request. It is a grounded research
// call on DEFAULT_MODEL, then an ungrounded structuring call on
// STRUCTURING_MODEL — and if either model is refused, gemini.ts retries on its
// fallback, which is a third. These cases are those calls, on those models, run
// one at a time, so a 429 can be pinned to a specific one instead of to "the AI".
//
//   node scripts/diagnose-gemini.mjs --app
//
const APP_CASES = [
  {
    name:  'A. control — plain ungrounded text on the default model',
    model: 'gemini-3.5-flash',
    config: { systemInstruction: SYSTEM_PROSE, maxOutputTokens: 512 },
  },
  {
    name:  'B. Google Search grounding on the default model (no longer used by the app)',
    model: 'gemini-3.5-flash',
    config: { systemInstruction: SYSTEM_PROSE, tools: [{ googleSearch: {} }] },
  },
  {
    name:  'C. structuring pass — ungrounded JSON on the structuring model',
    model: 'gemini-3.5-flash-lite',
    config: {
      systemInstruction: SYSTEM_JSON,
      maxOutputTokens:   9000,
      responseMimeType:  'application/json',
      thinkingConfig:    { thinkingBudget: 0 },
    },
  },
  {
    name:  'D. fallback target — plain text on gemini-3.6-flash',
    model: 'gemini-3.6-flash',
    config: { systemInstruction: SYSTEM_PROSE, maxOutputTokens: 512 },
  },
]

// --- run -------------------------------------------------------------------

const appMode = process.argv.includes('--app')
const cases   = appMode ? APP_CASES : SHAPE_CASES

console.log(appMode
  ? 'Running the calls the app actually makes, one at a time.\n'
  : `model: ${MODEL}\n`)

for (const c of cases) {
  const model   = c.model ?? MODEL
  const started = Date.now()
  try {
    const res = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: USER }] }],
      config:   c.config,
    })

    const secs   = ((Date.now() - started) / 1000).toFixed(1)
    const text   = res.text ?? ''
    const cand   = res.candidates?.[0]
    const parts  = cand?.content?.parts ?? []
    const usage  = res.usageMetadata ?? {}
    const chunks = cand?.groundingMetadata?.groundingChunks?.length ?? 0

    console.log(c.name)
    console.log(`   ${text.trim() ? 'OK  ' : 'EMPTY'}  ${secs}s   [${model}]`)
    console.log(`   finishReason : ${cand?.finishReason ?? '(none)'}`)
    console.log(`   text length  : ${text.length}`)
    console.log(`   parts        : ${parts.length}` +
      (parts.length ? ` [${parts.map(p => (p.thought ? 'thought' : Object.keys(p).join('+'))).join(', ')}]` : ''))
    console.log(`   tokens       : prompt ${usage.promptTokenCount ?? '?'}, ` +
      `thoughts ${usage.thoughtsTokenCount ?? 0}, output ${usage.candidatesTokenCount ?? '?'}, ` +
      `total ${usage.totalTokenCount ?? '?'}`)
    console.log(`   sources      : ${chunks}`)
    if (text.trim()) console.log(`   first 100    : ${text.trim().slice(0, 100).replace(/\s+/g, ' ')}`)
    console.log()
  } catch (err) {
    const secs = ((Date.now() - started) / 1000).toFixed(1)
    console.log(c.name)
    console.log(`   ERROR  ${secs}s   [${model}]`)
    reportError(err)
    console.log()
  }
}

console.log('Paste this output back. The key is not in it.')
