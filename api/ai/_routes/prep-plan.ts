// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/prep-plan.ts
// POST /api/ai/prep-plan
//
// Half two of the prep pack: what this specific candidate should say, drawn
// from their own CV and the job description. Requested in parallel with
// prep-pack.ts — see prepResearchResponseSchema for why the work is split.
//
// This half never searches. Everything it needs is already in the request, so
// it returns quickly and independently of how the research half fares.
// ---------------------------------------------------------------------------

import { callGemini, localeSystemSuffix, LIGHT_THINKING } from '../_lib/gemini.js'
import { createAIRoute } from '../_lib/handler.js'
import { GROUNDING_RULES } from '../_lib/prompt.js'
import { prepPackRequestSchema, prepPlanResponseSchema } from '../_lib/schemas.js'

const SYSTEM = `\
You are an interview coach preparing one candidate for one specific interview. Everything you write is read the night before and acted on.

Your half of the pack is the candidate: what to lead with, what they will be asked technically, and what to have ready. Return a single JSON object with exactly these keys, respecting every cap:
{
  "roleSummary":                "2-3 sentences: what winning in this role looks like in the first 6 months",
  "reviewFromCV":               ["max 5 things from THIS candidate's CV to lead with here, each tied to something the role needs"],
  "expectedTechnicalQuestions": ["max 6, specific — 'write a SQL query with a window function', not 'SQL questions'"],
  "recommendedStarStories": [
    {
      "title":     "short handle, e.g. 'The pipeline that kept breaking'",
      "situation": "2 sentences", "task": "1-2 sentences", "action": "3-4 sentences", "result": "1-2 sentences"
    }
  ],
  "finalChecklist": ["max 8 concrete prep items, each with the reason it matters"],
  "dayOfPlan":      ["max 5 things to do in the last hour, in order"]
}

Rules:
— At most 3 STAR stories, built ONLY from the candidate's real CV, projects, and past rounds. Three grounded ones beat five invented ones.
— If the material does not support a story, say so in that story's situation field rather than inventing one.
— Match the technical questions to the role level and the interview type given.
— No filler advice. Never write "get a good night's sleep" or "be yourself".
— If context is thin, say what is missing in the relevant field instead of padding it.
${GROUNDING_RULES}`

export default createAIRoute({
  name:   'prep-plan',
  schema: prepPackRequestSchema,

  async run({ body, apiKey }) {
    const sections: string[] = [
      `Interview type: ${body.interviewType}`,
      `Role: ${body.application.title} at ${body.application.company}`,
      `Current stage: ${body.application.stage}`,
    ]

    if (body.userBackground) sections.push(`CANDIDATE BACKGROUND:\n${body.userBackground}`)

    if (body.cv) {
      sections.push(
        'CV IN PLAY:\n' +
        `Emphasis: ${body.cv.emphasis}\n` +
        `Skills: ${body.cv.skillsHighlighted.join(', ') || '(none listed)'}\n` +
        `Projects: ${body.cv.projectsHighlighted.join(', ') || '(none listed)'}`,
      )
    } else {
      sections.push(
        'NO CV WAS ATTACHED. Do not invent projects. Make reviewFromCV say what is missing, ' +
        'and give STAR stories as outlines the candidate fills in.',
      )
    }

    if (body.application.jdText)        sections.push(`JOB DESCRIPTION:\n${body.application.jdText}`)
    if (body.application.aiRoleSummary) sections.push(`SAVED ROLE ANALYSIS:\n${body.application.aiRoleSummary}`)
    if (body.application.notes)         sections.push(`APPLICATION NOTES:\n${body.application.notes}`)

    if (body.pastInterviews.length > 0) {
      const rounds = body.pastInterviews
        .map(pi =>
          `${pi.type}\n  Asked: ${pi.questions.join('; ') || '(not recorded)'}\n` +
          `  Takeaways: ${pi.takeaways || '(none)'}`,
        )
        .join('\n\n')
      sections.push(`PAST ROUNDS IN THIS PROCESS:\n${rounds}`)
    }

    const data = await callGemini({
      apiKey,
      system:         SYSTEM + localeSystemSuffix(body.locale),
      user:           sections.join('\n\n'),
      schema:         prepPlanResponseSchema,
      maxTokens:      12_000,
      thinkingBudget: LIGHT_THINKING,
    })
    return { data }
  },
})
