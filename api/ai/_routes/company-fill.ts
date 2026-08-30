// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/company-fill.ts
// POST /api/ai/company-fill
//
// Researches a company by name and returns structured fields for a new Company
// record, grounded in Google Search.
//
// Grounding matters here more than anywhere else in the app: an ungrounded
// model will confidently size a Big Four firm at 1-10 people, and a small
// Israeli startup it has never heard of gets invented wholesale. Search results
// are the difference between research and plausible fiction.
//
// For the long-form interview brief, see company-brief.ts. This route only
// fills the CRM's columns.
// ---------------------------------------------------------------------------

import { callGeminiGrounded, localeSystemSuffix } from '../_lib/gemini.js'
import { createAIRoute } from '../_lib/handler.js'
import { RESEARCH_RULES } from '../_lib/prompt.js'
import { companyFillRequestSchema, companyFillResponseSchema } from '../_lib/schemas.js'

const SYSTEM = `\
You research companies for a job-seeker's CRM. The user gives you a company name; you return a single JSON object with exactly these keys:
{
  "industry":        "primary industry tag, e.g. 'AI / Cybersecurity' or 'E-commerce'",
  "size":            one of "1-10" | "11-50" | "51-200" | "201-500" | "501-2000" | "2001-10000" | "10000+" | null,
  "location":        "primary HQ — 'City, Country' (or 'Tel Aviv · Global' for Israeli multinationals)",
  "description":     "2-3 sentence overview of what the company does, in plain language",
  "website":         "https://… or null",
  "linkedinUrl":     "https://linkedin.com/company/… or null",
  "glassdoorRating": number 0-5 with one decimal, or null if you cannot verify it,
  "techStack":       ["frameworks / languages / platforms the company is known to use, max 8"],
  "disambiguation":  "ONLY when several companies match the name — a one-sentence question. Otherwise null."
}

Rules:
— Headcount especially: use the company's own figure or a reputable source's. Do not infer size from how familiar the name feels.
— Keep description neutral and factual; do not editorialize.
— For Israeli companies, location should normally name a city and "Israel".
— size buckets reflect headcount — pick the closest fit.
— If the name is ambiguous, set disambiguation to ask which company; other fields may still describe the most likely match.
— Do NOT include a leading "@" in linkedinUrl. Use a full https:// URL or null.
${RESEARCH_RULES}`

export default createAIRoute({
  name:   'company-fill',
  schema: companyFillRequestSchema,

  async run({ body, apiKey }) {
    const userMsg = body.hint
      ? `Company name: ${body.companyName}\nDisambiguator hint: ${body.hint}`
      : `Company name: ${body.companyName}`

    const { data, sources } = await callGeminiGrounded({
      apiKey,
      system:    SYSTEM + localeSystemSuffix(body.locale),
      user:      userMsg,
      schema:    companyFillResponseSchema,
      maxTokens: 12_000,
    })

    // Sources let the UI show where each claim came from, so the user can
    // check a number rather than trusting it.
    return { data, sources }
  },
})
