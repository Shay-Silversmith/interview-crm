// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/jd-summarize.ts
// POST /api/ai/jd-summarize
//
// Turns either a job-posting URL or pasted JD text into a clean bullet
// summary. When a URL is provided we let Claude fetch it via the web_fetch
// server tool. The user reviews the bullets in the UI before saving.
// ---------------------------------------------------------------------------

import type { VercelRequest, VercelResponse } from '@vercel/node'
import type Anthropic from '@anthropic-ai/sdk'
import { callClaudeAdvanced, localeSystemSuffix, getUserApiKey } from './_lib/claude'
import { checkRateLimit, getIP } from './_lib/rate-limit'
import {
  jdSummarizeRequestSchema,
  jdSummarizeResponseSchema,
  type JDSummarizeRequest,
} from './_lib/schemas'

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM = `\
You convert long job descriptions into a clean, scannable summary that a candidate can paste into their job-search CRM. Return ONLY a single JSON object — no markdown fences, no commentary.

The JSON must have exactly these keys:
{
  "headline": "1 sentence: the role + company + most important context",
  "bullets":  ["6-10 short bullet points covering: core responsibilities, must-have qualifications, nice-to-haves, tech stack, location/work model, salary if mentioned, perks. Each bullet ≤ 15 words."],
  "bodyText": "Plain-text version, with bullets prefixed by '• ', ready to drop into a multi-line textarea. Start with the headline as the first line, then a blank line, then the bullets."
}

Rules:
— Strip marketing fluff. Lead with concrete duties and requirements.
— Preserve specific technologies, years of experience, and quantifiable details when present.
— If the user provided a URL, fetch the page and base the summary on its actual contents. If the page is unreachable or behind auth, say so in the headline ("(JD page could not be fetched)") and produce a best-effort summary from the URL slug + any text the user included.
— Never invent details that aren't in the source.
— Keep tone neutral and factual.`

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCORSHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const ip = getIP(req.headers as Record<string, string | string[] | undefined>)
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

  // Build user message + tools — when a URL is provided we let Claude fetch
  // it directly via web_fetch; otherwise we just hand it the pasted text.
  const userMsgParts: string[] = []
  if (body.jdUrl)  userMsgParts.push(`Job posting URL: ${body.jdUrl}`)
  if (body.jdText) userMsgParts.push(`Pasted JD text:\n${body.jdText}`)
  userMsgParts.push('\nProduce the summary as specified.')

  const tools: Anthropic.Messages.ToolUnion[] | undefined = body.jdUrl
    ? [
        {
          type: 'web_fetch_20250910',
          name: 'web_fetch',
          max_uses: 2,
        } as unknown as Anthropic.Messages.ToolUnion,
      ]
    : undefined

  try {
    const data = await callClaudeAdvanced({
      system:    SYSTEM + localeSystemSuffix(body.locale),
      messages:  [{ role: 'user', content: userMsgParts.join('\n\n') }],
      schema:    jdSummarizeResponseSchema,
      maxTokens: 1500,
      tools,
      apiKey:    getUserApiKey(req.headers as Record<string, string | string[] | undefined>),
    })
    return res.status(200).json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    if (process.env.NODE_ENV !== 'production') console.error('[jd-summarize]', err)
    return res.status(500).json({ ok: false, error: message })
  }
}

function setCORSHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}
