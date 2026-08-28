// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/prep-pack.ts
// POST /api/ai/prep-pack
//
// Generates a comprehensive, personalised interview prep pack using Gemini.
// ---------------------------------------------------------------------------

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { callGemini, localeSystemSuffix, getGeminiApiKey } from './_lib/gemini.js'
import { checkRateLimit, getIP } from './_lib/rate-limit.js'
import {
  prepPackRequestSchema,
  prepPackResponseSchema,
  type PrepPackRequest,
} from './_lib/schemas.js'

const SYSTEM = `\
You are an elite interview coach with deep knowledge of technical and behavioural interviews at top tech companies.

Build a comprehensive, personalised prep pack for the candidate's upcoming interview. Return a single JSON object with exactly these keys:
{
  "companySnapshot":            "2-3 sentences on what the company does, culture signals, and why this role matters there",
  "roleSummary":                "What winning in this role looks like — measurable outcomes, team context, career trajectory",
  "reviewFromCV":               ["4-6 specific CV strengths to lead with in this interview context"],
  "expectedHRQuestions":        ["5-7 HR/behavioural questions this company is likely to ask"],
  "expectedTechnicalQuestions": ["5-8 technical questions based on the role level and interview type"],
  "recommendedStarStories":     [
    { "situation": "...", "task": "...", "action": "...", "result": "..." }
  ],
  "questionsToAsk":  ["4-6 sharp, well-researched questions to ask the interviewer"],
  "finalChecklist":  ["6-10 concrete items to complete before the interview"]
}

Rules:
— Build on the candidate's actual background, CV, and past interviews — do not invent stories.
— Tailor everything to the specific company, role, and interview type provided.
— For recommendedStarStories: suggest 3-4 story frameworks grounded in the candidate's real projects/experiences.
— For questionsToAsk: avoid generic questions; make them show genuine interest and research.
— Be specific and actionable. Avoid filler advice like "get a good night's sleep."
— If context is limited, say so clearly rather than inventing details.`

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

  const parsed = prepPackRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues.map(i => i.message).join('; '),
    })
  }

  const body: PrepPackRequest = parsed.data
  const sections: string[] = [
    `Interview type: ${body.interviewType}`,
    `Role: ${body.application.title} at ${body.application.company}`,
    `Current stage: ${body.application.stage}`,
  ]
  if (body.userBackground)      sections.push(`\nCandidate background:\n${body.userBackground}`)
  if (body.cv) {
    sections.push(
      `\nCV focus:\nEmphasis: ${body.cv.emphasis}` +
      `\nSkills: ${body.cv.skillsHighlighted.join(', ')}` +
      `\nProjects: ${body.cv.projectsHighlighted.join(', ')}`
    )
  }
  if (body.company?.summary)    sections.push(`\nCompany summary: ${body.company.summary}`)
  if (body.application.jdText)  sections.push(`\nJob description:\n${body.application.jdText}`)
  if (body.application.notes)   sections.push(`\nApplication notes: ${body.application.notes}`)
  if (body.pastInterviews.length > 0) {
    const interviewSummary = body.pastInterviews.map(pi =>
      `${pi.type}: questions asked — ${pi.questions.join('; ')}. Takeaways: ${pi.takeaways}`
    ).join('\n')
    sections.push(`\nPast interview rounds:\n${interviewSummary}`)
  }

  try {
    const data = await callGemini({
      apiKey,
      system:    SYSTEM + localeSystemSuffix(body.locale),
      user:      sections.join('\n'),
      schema:    prepPackResponseSchema,
      maxTokens: 2500,
    })
    return res.status(200).json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    if (process.env.NODE_ENV !== 'production') console.error('[prep-pack]', err)
    return res.status(500).json({ ok: false, error: message })
  }
}

function setCORSHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key')
}
