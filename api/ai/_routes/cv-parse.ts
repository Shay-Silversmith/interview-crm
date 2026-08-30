// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/cv-parse.ts
// POST /api/ai/cv-parse
//
// Reads an uploaded CV (PDF / DOCX / image) and extracts structured highlights
// via Gemini's multimodal API. Files are sent inline as base64.
//
// It also returns extractedText — a condensed plain-text rendering of the CV.
// The three summary fields are enough to label a CV version in a list, but not
// enough to write a STAR story from: "Skills: Python, SQL" cannot ground "tell
// me about a time you...". The other tools read extractedText instead.
// ---------------------------------------------------------------------------

import { callGemini, localeSystemSuffix, type GeminiPart } from '../_lib/gemini.js'
import { createAIRoute } from '../_lib/handler.js'
import { cvParseRequestSchema, cvParseResponseSchema } from '../_lib/schemas.js'

const SYSTEM = `\
You read resumes (CVs) and extract structured content for a job-search CRM. The user attaches the file. Return a single JSON object with exactly these keys:
{
  "emphasis":            "1 sentence describing the role types this CV is best suited for, e.g. 'Data-heavy PM roles at scale-ups'",
  "skillsHighlighted":   ["6-12 specific hard skills, languages, frameworks, tools — drawn directly from the CV"],
  "projectsHighlighted": ["3-6 standout projects or accomplishments, each a short phrase like 'Real-time fraud pipeline (40% latency reduction)'"],
  "suggestedName":       "short label for this CV version, 30 characters or fewer, focused on the specialty",
  "extractedText":       "a condensed plain-text rendering of the CV: every role with employer, title and dates; education; each project with what was actually built and any numbers stated. Preserve specifics and figures exactly. Drop only formatting, contact details, and filler. This is what the other tools build interview answers from, so detail matters more than brevity."
}

Rules:
— Only include content that actually appears in the CV. Never invent a role, project, tool, or number.
— Skills must be specific ("PostgreSQL", "TypeScript", "Tableau"), not generic ("databases", "programming").
— Keep every quantified outcome the CV states, with its number intact — those are what make an interview answer credible.
— If the file is unreadable, return empty lists and set emphasis to say the file could not be read.`

export default createAIRoute({
  name:   'cv-parse',
  schema: cvParseRequestSchema,

  async run({ body, apiKey }) {
    const isInlineMime =
      body.mimeType === 'application/pdf' || body.mimeType.startsWith('image/')

    const userParts: GeminiPart[] = isInlineMime
      ? [
          { inlineData: { mimeType: body.mimeType, data: body.base64Data } },
          { text: `Filename: ${body.fileName}\n\nExtract the structured content as specified.` },
        ]
      : [
          // DOCX / TXT — pass base64 inline as text. Quality varies; PDF works best.
          {
            text:
              `Filename: ${body.fileName}\nMime: ${body.mimeType}\n\n` +
              '(Base64 payload follows — extract what you can; if it is unreadable, ' +
              'return empty lists and say so in emphasis rather than guessing.)\n\n' +
              body.base64Data.slice(0, 200_000),
          },
        ]

    const data = await callGemini({
      apiKey,
      system:    SYSTEM + localeSystemSuffix(body.locale),
      userParts,
      schema:    cvParseResponseSchema,
      // extractedText is the bulk of this response and the reason the old
      // 1200-token ceiling truncated CVs of any real length.
      maxTokens: 10_000,
    })

    return { data }
  },
})
