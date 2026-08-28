// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/_test.ts
// POST /api/ai/_test
//
// Trivial Gemini probe used by the Settings UI's "Test key" button
// (Prompt 3b). Validates that the supplied x-gemini-api-key header works
// without spending a real prep-pack/JD-parser quota.
//
// 200 { ok: true,  model, sample }    — call succeeded
// 401 { ok: false, error }            — no key in header
// 502 { ok: false, error }            — Gemini rejected / network error
// ---------------------------------------------------------------------------

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { callGeminiRaw, getGeminiApiKey } from './_lib/gemini.js'
import { checkRateLimit, getIP } from './_lib/rate-limit.js'

const MODEL = 'gemini-2.5-flash'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCORSHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const headers = req.headers as Record<string, string | string[] | undefined>
  const apiKey = getGeminiApiKey(headers)
  if (!apiKey) {
    return res.status(401).json({ ok: false, error: 'Gemini API key required.' })
  }

  const ip = getIP(headers)
  const rl = checkRateLimit(ip)
  if (!rl.allowed) {
    return res.status(429).json({
      ok: false,
      error: `Rate limit reached. Try again in ${Math.ceil(rl.resetInMs / 1000)} seconds.`,
    })
  }

  try {
    const text = await callGeminiRaw({
      apiKey,
      // Tiny probe — responseMimeType=application/json means the reply will be
      // a small JSON value; we don't care about the shape, only that we got
      // something back without throwing.
      system:    'You are a connectivity probe. Reply with a single short JSON object.',
      user:      'Return JSON: {"status":"ok"}',
      maxTokens: 32,
      model:     MODEL,
    })
    return res.status(200).json({
      ok:     true,
      model:  MODEL,
      sample: text.trim().slice(0, 40),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    // Log in production too: without this a 500 shows up in the Vercel logs
    // with no reason attached, which is how the grounded-JSON failure stayed
    // invisible. The key is never part of the error object.
    console.error('[_test]', err)
    return res.status(502).json({ ok: false, error: message })
  }
}

function setCORSHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key')
}
