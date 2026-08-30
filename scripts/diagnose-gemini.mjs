// ---------------------------------------------------------------------------
// InterviewFlow — scripts/diagnose-gemini.mjs
//
// Answers one question with evidence instead of guesswork: which call shapes
// does this Gemini key actually return text for?
//
// The research tools kept finishing with no text, and tuning thinking budgets
// and token ceilings blind did not fix it. This runs the candidate shapes side
// by side and prints what came back — finishReason, token usage, and how much
// text — so the next change is informed by a result rather than a hypothesis.
//
// Run:
//   node scripts/diagnose-gemini.mjs
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

const ai    = new GoogleGenAI({ apiKey })
const MODEL = 'gemini-2.5-flash'

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

const cases = [
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

// --- run -------------------------------------------------------------------

console.log(`model: ${MODEL}\n`)

for (const c of cases) {
  const started = Date.now()
  try {
    const res = await ai.models.generateContent({
      model:    MODEL,
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
    console.log(`   ${text.trim() ? 'OK  ' : 'EMPTY'}  ${secs}s`)
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
    const msg  = err instanceof Error ? err.message : String(err)
    console.log(c.name)
    console.log(`   ERROR  ${secs}s`)
    // Strip anything key-shaped before printing, belt and braces.
    console.log(`   ${msg.replace(/AIza[0-9A-Za-z_-]{10,}/g, '[redacted]').slice(0, 400)}`)
    console.log()
  }
}

console.log('Paste this output back. The key is not in it.')
