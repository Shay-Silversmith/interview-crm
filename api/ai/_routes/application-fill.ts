// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/_routes/application-fill.ts
// POST /api/ai/application-fill
//
// Reads a job posting and returns the fields of a new application, so a link
// becomes a filled form instead of twenty minutes of copying.
//
// Every field is nullable and the model is told to leave them null rather than
// infer. These values are written straight into a form the user will submit: an
// invented salary band becomes a number they negotiate against, and a guessed
// work model becomes a reason they take the wrong interview. What the posting
// did not say is reported in `notFound` instead.
// ---------------------------------------------------------------------------

import {
  callGemini,
  researchGrounded,
  structureResearch,
  localeSystemSuffix,
  NO_THINKING,
} from '../_lib/gemini.js'
import { createAIRoute } from '../_lib/handler.js'
import {
  applicationFillRequestSchema,
  applicationFillResponseSchema,
} from '../_lib/schemas.js'

const SYSTEM = `\
You read one job posting and extract the facts needed to file it in a job-search CRM.

Return a single JSON object with exactly these keys:
{
  "companyName":    "the hiring company, or null",
  "roleName":       "the job title exactly as posted, or null",
  "location":       "city and country as posted, e.g. 'Tel Aviv, Israel', or null",
  "workModel":      "On-site" | "Hybrid" | "Remote" | null,
  "jobScope":       "Full-time" | "4 days" | "3 days" | "2 days" | null,
  "salaryMin":      number or null,
  "salaryMax":      number or null,
  "salaryType":     "Hourly" | "Monthly" | null,
  "currency":       "ILS" | "USD" | "EUR" | … or null,
  "jobDescription": "the posting's responsibilities and requirements as clean plain text, bullets prefixed with '• '. Strip boilerplate, benefits blurbs and equal-opportunity notices.",
  "whyInteresting": "1-2 sentences on what makes this role worth applying to, drawn only from the posting",
  "notFound":       ["names of the fields the posting genuinely does not state"],
  "sourceNote":     "only if the page could not be read, was expired, or was a list of jobs rather than one posting — otherwise null"
}

Rules, and these override everything else:
— NEVER infer a value the posting does not state. A missing salary is null and an entry in notFound, never an estimate from the market or the job title.
— workModel only when the posting says so. "Tel Aviv office" alone is not enough to call it On-site; hybrid arrangements are usually stated explicitly.
— Salary: extract the numbers as written. If it says "60-80 ₪/hour" that is salaryMin 60, salaryMax 80, salaryType Hourly, currency ILS. If a monthly range is given, salaryType is Monthly. Never convert between the two.
— jobDescription must be the posting's own content, condensed and tidied, not a summary in your words and not padded.
— If the page could not be read at all, set every field to null, explain in sourceNote, and do not invent a posting.`

export default createAIRoute({
  name:   'application-fill',
  schema: applicationFillRequestSchema,

  async run({ body, apiKey }) {
    const system = SYSTEM + localeSystemSuffix(body.locale)

    // Pasted text needs no fetching, so it takes the cheap single-call path.
    if (body.jdText?.trim()) {
      const data = await callGemini({
        apiKey,
        system,
        user:           `JOB POSTING TEXT:\n${body.jdText.trim()}`,
        schema:         applicationFillResponseSchema,
        maxTokens:      12_000,
        thinkingBudget: NO_THINKING,
      })
      return { data }
    }

    // A link has to be fetched, which is the tool-enabled path — and that runs
    // in two stages so neither half can exhaust the host's function timeout.
    if (body.stage === 'structure') {
      const data = await structureResearch({
        apiKey,
        system,
        research:  body.research ?? '',
        schema:    applicationFillResponseSchema,
        maxTokens: 12_000,
      })
      return { data }
    }

    const { research, sources } = await researchGrounded({
      apiKey,
      system,
      user:
        `Read this job posting and extract its facts: ${body.jdUrl}\n\n` +
        'If the page cannot be read, requires a login, has expired, or is a list of jobs ' +
        'rather than one posting, say exactly that instead of describing a job.',
      maxTokens: 12_000,
      urls:      body.jdUrl ? [body.jdUrl] : undefined,
    })

    if (body.stage === 'research') return { data: null, research, sources }

    const data = await structureResearch({
      apiKey, system, research, schema: applicationFillResponseSchema, maxTokens: 12_000,
    })
    return { data, sources }
  },
})
