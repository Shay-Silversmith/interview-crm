// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/company-fill.ts
// POST /api/ai/company-fill
//
// Researches a company by name and returns structured fields for a new
// Company record, grounded in Google Search.
//
// Grounding matters here more than anywhere else in the app: an ungrounded
// model will confidently size a Big Four firm at 1-10 people, and a small
// Israeli startup it has never heard of gets invented wholesale. Search results
// are the difference between research and plausible fiction.
//
// callGeminiGrounded works around the API's refusal to combine the search tool
// with forced JSON output; see its comment for how.
// ---------------------------------------------------------------------------

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { callGeminiGrounded, localeSystemSuffix, getGeminiApiKey } from './_lib/gemini.js'
import { checkRateLimit, getIP } from './_lib/rate-limit.js'
import {
  companyFillRequestSchema,
  companyFillResponseSchema,
  type CompanyFillRequest,
} from './_lib/schemas.js'

const SYSTEM = `\
You research companies for a job-seeker's CRM. The user will give you a company name and you will return a single JSON object with exactly these keys:
{
  "industry":        "primary industry tag, e.g. 'AI / Cybersecurity' or 'E-commerce'",
  "size":            one of "1-10" | "11-50" | "51-200" | "201-500" | "501-2000" | "2001-10000" | "10000+" | null,
  "location":        "primary HQ — 'City, Country' (or 'Tel Aviv · Global' for Israeli multinationals)",
  "description":     "2-3 sentence overview of what the company does, written in plain language",
  "website":         "https://… or null",
  "linkedinUrl":     "https://linkedin.com/company/… or null",
  "glassdoorRating": number 0-5 with one decimal, or null if you can't verify,
  "techStack":       ["array of frameworks / languages / platforms the company is known to use, max 8 items"],
  "disambiguation":  "ONLY when the name is ambiguous (multiple companies match) — a one-sentence question. Otherwise null."
}

Rules:
— Search the web before answering. Base every field on what the results actually say.
— Never invent specifics. If the search results do not establish a field, set it to null (where allowed) rather than guessing.
— Headcount especially: use the company's own or a reputable source's figure. Do not infer size from how familiar the name feels.
— Return ONLY the JSON object — no prose before or after it, no markdown fences.
— Keep description neutral and factual; don't editorialize.
— For Israeli companies, location should normally include "Israel" or a city like "Tel Aviv, Israel".
— size buckets reflect headcount — pick the closest fit, not the exact number.
— If the name is ambiguous, set disambiguation to ask which company. In that case all other fields can still be best-guess for the most likely match.
— Do NOT include a leading "@" in linkedinUrl. Use a full https:// URL or null.`

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

  const parsed = companyFillRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
    })
  }

  const body: CompanyFillRequest = parsed.data
  const userMsg = body.hint
    ? `Company name: ${body.companyName}\nDisambiguator hint: ${body.hint}`
    : `Company name: ${body.companyName}`

  try {
    const { data, sources } = await callGeminiGrounded({
      apiKey,
      system:    SYSTEM + localeSystemSuffix(body.locale),
      user:      userMsg,
      schema:    companyFillResponseSchema,
      maxTokens: 1500,
    })
    // sources let the UI show where each claim came from, so the user can
    // check a number rather than trusting it.
    return res.status(200).json({ ok: true, data, sources })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    if (process.env.NODE_ENV !== 'production') console.error('[company-fill]', err)
    return res.status(500).json({ ok: false, error: message })
  }
}

function setCORSHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key')
}
