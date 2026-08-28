// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/jd-summarize.ts
// POST /api/ai/jd-summarize
//
// Summarises pasted JD text into bullets via Gemini.
//
// NOTE: The Claude version used the web_fetch server tool to fetch a URL
// directly. Gemini's urlContext / googleSearch tools conflict with
// responseMimeType=json, so this port requires either jdText (preferred) or
// a URL + slug/keywords the model can interpret from training data. If only
// a URL is provided and the model can't fetch it, it falls back to a
// best-effort summary noting the limitation in the headline.
// ---------------------------------------------------------------------------

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { callGemini, localeSystemSuffix, getGeminiApiKey } from './_lib/gemini.js'
import { checkRateLimit, getIP } from './_lib/rate-limit.js'
import {
  jdSummarizeRequestSchema,
  jdSummarizeResponseSchema,
  type JDSummarizeRequest,
} from './_lib/schemas.js'

const SYSTEM = `\
You convert long job descriptions into a clean, scannable summary that a candidate can paste into their job-search CRM. Return a single JSON object with exactly these keys:
{
  "headline": "1 sentence: the role + company + most important context",
  "bullets":  ["6-10 short bullet points covering: core responsibilities, must-have qualifications, nice-to-haves, tech stack, location/work model, salary if mentioned, perks. Each bullet ≤ 15 words."],
  "bodyText": "Plain-text version, with bullets prefixed by '• ', ready to drop into a multi-line textarea. Start with the headline as the first line, then a blank line, then the bullets."
}

Rules:
— Strip marketing fluff. Lead with concrete duties and requirements.
— Preserve specific technologies, years of experience, and quantifiable details when present.
— You do NOT have live web access. If the user provided only a URL and no text, do your best from the URL slug; set headline to mention "(JD text not provided — summary may be incomplete)".
— Never invent details that aren't in the source.
— Keep tone neutral and factual.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCORSHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const headers = req.headers as Record<string, string | string[] | undefined>
  const apiKey = getGeminiApiKey(headers)
  if (!apiKey) {
    return res.status(401).json({ ok: false, error: 'Gemini API key required. Set it in Settings → AI Preferences.' })
  }

  const ip = getIP(headers)
  const rl = checkRateLimit(ip)
  if (!rl.allowed) {
    return res.status(429).json({
      ok: false,
      error: `Rate limit reached. Try again in ${Math.ceil(rl.resetInMs / 1000)} seconds.`,
    })
  }

  const parsed = jdSummarizeRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
    })
  }

  const body: JDSummarizeRequest = parsed.data
  const userMsgParts: string[] = []
  if (body.jdUrl)  userMsgParts.push(`Job posting URL: ${body.jdUrl}`)
  if (body.jdText) userMsgParts.push(`Pasted JD text:\n${body.jdText}`)
  userMsgParts.push('\nProduce the summary as specified.')

  try {
    const data = await callGemini({
      apiKey,
      system:    SYSTEM + localeSystemSuffix(body.locale),
      user:      userMsgParts.join('\n\n'),
      schema:    jdSummarizeResponseSchema,
      maxTokens: 1500,
    })
    return res.status(200).json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    // Log in production too: without this a 500 shows up in the Vercel logs
    // with no reason attached, which is how the grounded-JSON failure stayed
    // invisible. The key is never part of the error object.
    console.error('[jd-summarize]', err)
    return res.status(500).json({ ok: false, error: message })
  }
}

function setCORSHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key')
}
