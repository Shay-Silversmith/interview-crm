// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/prep-pack.ts
// POST /api/ai/prep-pack
//
// Half one of the prep pack: what the live web says about this company and how
// it interviews. The CV-driven half lives in prep-plan.ts and is requested in
// parallel — see prepResearchResponseSchema for why the work is split.
//
// Grounded by default. The company snapshot and the expected HR questions are
// the two things a candidate is most likely to repeat out loud, and an
// ungrounded model writes both fluently and wrongly — which is how a prep pack
// becomes the reason someone says something false in the room.
// ---------------------------------------------------------------------------

import {
  callGemini,
  callGeminiGrounded,
  localeSystemSuffix,
  LIGHT_THINKING,
} from './_lib/gemini.js'
import { createAIRoute } from './_lib/handler.js'
import { GROUNDING_RULES, RESEARCH_RULES } from './_lib/prompt.js'
import { prepPackRequestSchema, prepResearchResponseSchema } from './_lib/schemas.js'

const SYSTEM = `\
You are an interview coach preparing one candidate for one specific interview. Everything you write is read the night before and acted on.

Your half of the pack is the company and its hiring loop. Return a single JSON object with exactly these keys, respecting every cap:
{
  "companySnapshot":     "3-4 sentences: what the company does, how it makes money, what changed recently, and why this role exists there. Concrete and current, no marketing language.",
  "expectedHRQuestions": ["max 6 behavioural or HR questions this company and this stage make likely"],
  "questionsToAsk":      ["max 5 questions that show real research. Nothing answerable from the homepage."],
  "redFlagsToProbe":     ["max 4 things worth quietly checking about the role or company — team churn, scope, why the seat is open. Phrased as questions to ask, not accusations."]
}

Rules:
— Tailor to the specific company, role, stage, and interview type given. A generic pack is a failed pack.
— Use the candidate's past rounds when provided: what was already asked will not be asked the same way again.
— No filler advice. Never write "get a good night's sleep" or "be yourself".
${GROUNDING_RULES}`

export default createAIRoute({
  name:   'prep-pack',
  schema: prepPackRequestSchema,

  async run({ body, apiKey }) {
    const sections: string[] = [
      `Interview type: ${body.interviewType}`,
      `Role: ${body.application.title} at ${body.application.company}`,
      `Current stage: ${body.application.stage}`,
    ]

    if (body.company?.summary) sections.push(`COMPANY NOTES ON FILE:\n${body.company.summary}`)
    if (body.application.jdText) {
      sections.push(`JOB DESCRIPTION:\n${body.application.jdText.slice(0, 6000)}`)
    }
    if (body.application.notes) sections.push(`APPLICATION NOTES:\n${body.application.notes}`)

    if (body.pastInterviews.length > 0) {
      const rounds = body.pastInterviews
        .map(pi => `${pi.type} — asked: ${pi.questions.join('; ') || '(not recorded)'}. ` +
                   `Takeaways: ${pi.takeaways || '(none)'}`)
        .join('\n')
      sections.push(`PAST ROUNDS IN THIS PROCESS:\n${rounds}`)
    }

    const research = body.research !== false
    const system   = SYSTEM + (research ? `\n${RESEARCH_RULES}` : '') + localeSystemSuffix(body.locale)

    if (research) {
      sections.push(
        `Search the web for ${body.application.company}: what it does now, what changed in the ` +
        'last year, and what candidates publicly report about its interview loop for this kind of role.',
      )

      const { data, sources } = await callGeminiGrounded({
        apiKey,
        system,
        user:      sections.join('\n\n'),
        schema:    prepResearchResponseSchema,
        maxTokens: 8_000,
      })
      return { data, sources }
    }

    const data = await callGemini({
      apiKey,
      system,
      user:           sections.join('\n\n'),
      schema:         prepResearchResponseSchema,
      maxTokens:      8_000,
      thinkingBudget: LIGHT_THINKING,
    })
    return { data }
  },
})
