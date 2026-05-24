// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/company-fill.ts
// POST /api/ai/company-fill
//
// Researches a company by name and returns structured fields for a new
// Company record. Uses Gemini's training-data knowledge.
//
// NOTE: The Claude version used the web_search server tool to verify live
// facts. Gemini's googleSearch tool conflicts with responseMimeType=json,
// so this port runs without grounding. The model is instructed to set null
// for any field it can't confirm from its own knowledge.
// ---------------------------------------------------------------------------

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { callGemini, localeSystemSuffix, getGeminiApiKey } from './_lib/gemini'
import { checkRateLimit, getIP } from './_lib/rate-limit'
import {
  companyFillRequestSchema,
  companyFillResponseSchema,
  type CompanyFillRequest,
} from './_lib/schemas'

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
— Answer from your own knowledge. You do NOT have live web access.
— Never invent specifics. If you don't know a field, set it to null (where allowed) or use a generic descriptor.
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
    const data = await callGemini({
      apiKey,
      system:    SYSTEM + localeSystemSuffix(body.locale),
      user:      userMsg,
      schema:    companyFillResponseSchema,
      maxTokens: 1500,
    })
    return res.status(200).json({ ok: true, data })
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
