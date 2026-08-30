// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/jd-summarize.ts
// POST /api/ai/jd-summarize
//
// Turns a job posting into a clean bullet summary for the application record.
//
// A URL now actually works. The previous version told the model it had no web
// access and asked it to guess from the URL slug, which produced confident
// summaries of jobs that did not exist. When a URL is supplied the request goes
// through the tool-enabled path so the page is really fetched, and if it cannot
// be fetched the summary says so instead of inventing one.
// ---------------------------------------------------------------------------

import { callGemini, callGeminiGrounded, localeSystemSuffix } from '../_lib/gemini.js'
import { createAIRoute } from '../_lib/handler.js'
import { jdSummarizeRequestSchema, jdSummarizeResponseSchema } from '../_lib/schemas.js'

const SYSTEM = `\
You convert long job descriptions into a clean, scannable summary a candidate can paste into their job-search CRM. Return a single JSON object with exactly these keys:
{
  "headline": "1 sentence: the role, the company, and the most important context",
  "bullets":  ["6-10 short bullets covering core responsibilities, must-have qualifications, nice-to-haves, tech stack, location and work model, salary if stated, notable perks. Each bullet 15 words or fewer."],
  "bodyText": "plain-text version: the headline, a blank line, then the bullets each prefixed with '• '. Ready to drop into a textarea."
}

Rules:
— Strip marketing fluff. Lead with concrete duties and requirements.
— Preserve specific technologies, years of experience, and quantifiable details.
— Never invent details that are not in the source.
— If the posting could not be read, say so in the headline and return only what is actually known. Do not guess a job from a URL slug.
— Keep tone neutral and factual.`

export default createAIRoute({
  name:   'jd-summarize',
  schema: jdSummarizeRequestSchema,

  async run({ body, apiKey }) {
    const system = SYSTEM + localeSystemSuffix(body.locale)

    // Pasted text is more reliable than fetching, so it wins when both exist.
    if (body.jdText?.trim()) {
      const parts = [`Pasted JD text:\n${body.jdText.trim()}`]
      if (body.jdUrl) parts.unshift(`Source URL (context only): ${body.jdUrl}`)

      const data = await callGemini({
        apiKey,
        system,
        user:      parts.join('\n\n'),
        schema:    jdSummarizeResponseSchema,
        maxTokens: 8_000,
      })
      return { data }
    }

    const { data, sources } = await callGeminiGrounded({
      apiKey,
      system,
      user:
        `Read this job posting and summarise it: ${body.jdUrl}\n\n` +
        'If the page cannot be read, is expired, requires a login, or turns out to be a list of jobs ' +
        'rather than one posting, set the headline to say exactly that and return a single bullet ' +
        'explaining what went wrong. Do not invent a job description.',
      schema:    jdSummarizeResponseSchema,
      maxTokens: 12_000,
      urls:      body.jdUrl ? [body.jdUrl] : undefined,
    })
    return { data, sources }
  },
})
