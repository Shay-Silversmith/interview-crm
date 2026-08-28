// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/cv-parse.ts
// POST /api/ai/cv-parse
//
// Reads an uploaded CV (PDF / DOCX / image) and extracts structured
// highlights via Gemini's multimodal API. Files are sent inline as base64.
// ---------------------------------------------------------------------------

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { callGemini, localeSystemSuffix, getGeminiApiKey, type GeminiPart } from './_lib/gemini'
import { checkRateLimit, getIP } from './_lib/rate-limit'
import {
  cvParseRequestSchema,
  cvParseResponseSchema,
  type CVParseRequest,
} from './_lib/schemas'

const SYSTEM = `\
You read resumes (CVs) and extract structured highlights for a job-search CRM. The user will attach the file. Return a single JSON object with exactly these keys:
{
  "emphasis":            "1 sentence describing the role types this CV is best suited for, e.g. 'Data-heavy PM roles at scale-ups' or 'Backend engineering with distributed systems focus'",
  "skillsHighlighted":   ["6-12 specific hard skills, languages, frameworks, tools — drawn directly from the CV"],
  "projectsHighlighted": ["3-6 standout projects or accomplishments, each as a short phrase like 'Real-time fraud pipeline (40% latency reduction)'"],
  "suggestedName":       "Short label for this CV version, e.g. 'PM v2' or 'Data Engineering — Israeli tech'"
}

Rules:
— Only include skills/projects that actually appear in the CV. Don't invent.
— Skills should be specific (e.g. "PostgreSQL", "TypeScript", "Tableau") not generic ("databases", "programming").
— Project phrases should be 3-12 words, including a quantifiable outcome when present.
— suggestedName should be ≤ 30 chars, focused on the candidate's specialty.`

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

  const parsed = cvParseRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
    })
  }

  const body: CVParseRequest = parsed.data
  const isInlineMime =
    body.mimeType === 'application/pdf' || body.mimeType.startsWith('image/')

  const userParts: GeminiPart[] = isInlineMime
    ? [
        { inlineData: { mimeType: body.mimeType, data: body.base64Data } },
        { text: `Filename: ${body.fileName}\n\nExtract the structured highlights as specified.` },
      ]
    : [
        // DOCX / TXT — pass base64 inline as text. Quality varies; PDF works best.
        {
          text:
            `Filename: ${body.fileName}\nMime: ${body.mimeType}\n\n` +
            `(Base64 payload follows — extract what you can; if unreadable return reasonable empty values)\n\n` +
            body.base64Data.slice(0, 200_000),
        },
      ]

  try {
    const data = await callGemini({
      apiKey,
      system:    SYSTEM + localeSystemSuffix(body.locale),
      userParts,
      schema:    cvParseResponseSchema,
      maxTokens: 1200,
    })
    return res.status(200).json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    if (process.env.NODE_ENV !== 'production') console.error('[cv-parse]', err)
    return res.status(500).json({ ok: false, error: message })
  }
}

function setCORSHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key')
}
