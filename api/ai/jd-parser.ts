// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/jd-parser.ts
// POST /api/ai/jd-parser
//
// Parses a job description into structured insights using Gemini.
// Input:  { jdText, roleTitle?, userBackground? }
// Output: { ok: true, data: JDParserResponse } | { ok: false, error: string }
// ---------------------------------------------------------------------------

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { callGemini, getGeminiApiKey } from './_lib/gemini.js'
import { checkRateLimit, getIP } from './_lib/rate-limit.js'
import {
  jdParserRequestSchema,
  jdParserResponseSchema,
  type JDParserRequest,
} from './_lib/schemas.js'

const SYSTEM = `\
You are a precise job search analyst helping a candidate prepare for applications.

Analyze the provided job description and return a single JSON object with exactly these keys:
{
  "roleSummary":       "2-3 sentence overview of the role and its context",
  "responsibilities":  ["5-8 specific key responsibilities"],
  "requirements":      ["5-8 must-have skills or qualifications"],
  "niceToHaves":       ["3-5 preferred but not required"],
  "technologies":      ["specific tools, languages, platforms mentioned"],
  "whatTheyWant":      "1-2 sentences on the ideal candidate profile",
  "howIMatch":         ["3-5 ways the candidate's background aligns — use userBackground if provided, otherwise draw from JD language"],
  "whatToEmphasize":   ["3-5 specific talking points to highlight in interviews"],
  "possibleQuestions": ["5-7 likely interview questions for this role"],
  "prepChecklist":     ["5-8 concrete, actionable prep steps"]
}

Rules:
— Ground every claim in the JD text. Do not invent technologies or requirements not mentioned.
— Keep individual list items to 1 clear sentence or phrase.
— If userBackground is provided, tailor howIMatch and whatToEmphasize specifically to that candidate.
— Be direct and specific, not generic.`

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

  const parsed = jdParserRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues.map(i => i.message).join('; '),
    })
  }

  const body: JDParserRequest = parsed.data
  const userParts: string[] = []
  if (body.roleTitle)      userParts.push(`Role title: ${body.roleTitle}`)
  if (body.userBackground) userParts.push(`Candidate background: ${body.userBackground}`)
  userParts.push(`\nJob description:\n${body.jdText}`)

  try {
    const data = await callGemini({
      apiKey,
      system:    SYSTEM,
      user:      userParts.join('\n\n'),
      schema:    jdParserResponseSchema,
      maxTokens: 1500,
    })
    return res.status(200).json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    if (process.env.NODE_ENV !== 'production') console.error('[jd-parser]', err)
    return res.status(500).json({ ok: false, error: message })
  }
}

function setCORSHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key')
}
