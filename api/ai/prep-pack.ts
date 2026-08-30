// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/prep-pack.ts
// POST /api/ai/prep-pack
//
// The "prepare me" pack: everything the candidate needs for one specific
// interview, in one document.
//
// It runs grounded by default. The company snapshot and the expected questions
// are the two fields a candidate is most likely to repeat out loud, and an
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
import { prepPackRequestSchema, prepPackResponseSchema } from './_lib/schemas.js'

const SYSTEM = `\
You are an interview coach preparing one candidate for one specific interview. Everything you write will be read the night before and acted on.

Return a single JSON object with exactly these keys:
{
  "companySnapshot":  "3-5 sentences: what the company does, how it makes money, what changed recently, and why this role exists there. Concrete, current, no marketing language.",
  "roleSummary":      "what winning in this role looks like in the first 6 months — outcomes, team context, who they'd work with",
  "reviewFromCV":     ["4-6 specific things from THIS candidate's CV to lead with in THIS interview, each tied to something the role needs"],
  "expectedHRQuestions":        ["5-7 behavioural or HR questions this company and stage make likely"],
  "expectedTechnicalQuestions": ["5-8 technical questions matched to the role level and interview type. Be specific — 'write a SQL query with a window function', not 'SQL questions'."],
  "recommendedStarStories": [
    {
      "title":     "short handle for the story, e.g. 'The pipeline that kept breaking'",
      "situation": "...", "task": "...", "action": "...", "result": "..."
    }
  ],
  "questionsToAsk":   ["4-6 questions that show real research. Nothing answerable from the homepage."],
  "finalChecklist":   ["6-10 concrete prep items, each doable and each with the reason it matters"],
  "dayOfPlan":        ["what to do in the last hour before the interview, in order"],
  "redFlagsToProbe":  ["things worth quietly checking about the role or company during the conversation — team churn, scope, why the seat is open. Stated as questions to ask, not accusations."]
}

Rules:
— Build STAR stories ONLY from the candidate's real CV, projects, and past interviews. Give each a title. If the material does not support a story, say so in that story's situation field rather than inventing one.
— Tailor to the specific company, role, stage, and interview type given. A generic pack is a failed pack.
— Use the candidate's past interview rounds when provided: what was already asked will not be asked again the same way, and what they stumbled on will come back.
— No filler advice. Never write "get a good night's sleep" or "be yourself".
— If context is thin, say what is missing in the relevant field instead of padding it.
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

    if (body.company?.summary) sections.push(`COMPANY NOTES ON FILE:\n${body.company.summary}`)
    if (body.company?.productDescription) {
      sections.push(`PRODUCT NOTES ON FILE:\n${body.company.productDescription}`)
    }
    if (body.application.jdText)        sections.push(`JOB DESCRIPTION:\n${body.application.jdText}`)
    if (body.application.aiRoleSummary) sections.push(`SAVED ROLE ANALYSIS:\n${body.application.aiRoleSummary}`)
    if (body.application.notes)         sections.push(`APPLICATION NOTES:\n${body.application.notes}`)

    if (body.pastInterviews.length > 0) {
      const rounds = body.pastInterviews
        .map(pi =>
          `${pi.type}\n  Asked: ${pi.questions.join('; ') || '(not recorded)'}\n` +
          `  How it went: ${pi.roughAnswers.join('; ') || '(not recorded)'}\n` +
          `  Takeaways: ${pi.takeaways || '(none)'}`,
        )
        .join('\n\n')
      sections.push(`PAST ROUNDS IN THIS PROCESS:\n${rounds}`)
    }

    const research = body.research !== false
    const system   =
      SYSTEM +
      (research ? `\n${RESEARCH_RULES}` : '') +
      localeSystemSuffix(body.locale)

    if (research) {
      sections.push(
        `Search the web for ${body.application.company} before writing companySnapshot, ` +
        'expectedHRQuestions, questionsToAsk, and redFlagsToProbe. Look for what the company does now, ' +
        'what changed in the last year, and what candidates report about its interview loop for this kind of role.',
      )
      if (body.application.jdUrl) {
        sections.push(`Also read the posting itself: ${body.application.jdUrl}`)
      }

      const { data, sources } = await callGeminiGrounded({
        apiKey,
        system,
        user:      sections.join('\n\n'),
        schema:    prepPackResponseSchema,
        maxTokens: 14_000,
        urls:      body.application.jdUrl ? [body.application.jdUrl] : undefined,
      })
      return { data, sources }
    }

    const data = await callGemini({
      apiKey,
      system,
      user:           sections.join('\n\n'),
      schema:         prepPackResponseSchema,
      maxTokens:      12_000,
      thinkingBudget: LIGHT_THINKING,
    })
    return { data }
  },
})
