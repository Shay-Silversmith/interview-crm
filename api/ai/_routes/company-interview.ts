// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/company-interview.ts
// POST /api/ai/company-interview
//
// Half two of the company briefing: what to do with the research in the room —
// their hiring loop, culture signals, lines to use, questions to ask, and what
// to be aware of. Requested in parallel with company-brief.ts so each half gets
// its own function timeout; see companyProfileResponseSchema for the reasoning.
// ---------------------------------------------------------------------------

import { researchGrounded, structureResearch, localeSystemSuffix } from '../_lib/gemini.js'
import { createAIRoute } from '../_lib/handler.js'
import { candidateBlock, RESEARCH_RULES } from '../_lib/prompt.js'
import { companyBriefRequestSchema, companyInterviewResponseSchema } from '../_lib/schemas.js'

const SYSTEM = `\
You prepare a candidate for an interview at a specific company, often tomorrow. You have Google Search. Use it, then answer fast.

Your job is the interview-facing half of the briefing: how they hire, what they are like to work for, and what this candidate should say. Return a single JSON object with exactly these keys, respecting every cap:
{
  "interviewProcess": ["max 5. The hiring loop for this kind of role per public accounts (Glassdoor, Levels.fyi, candidate write-ups) — round names, rough counts, what each round tests. If nothing public was found, return one item saying so."],
  "culture":          ["max 4. Each must name its source, e.g. 'per their engineering blog'."],
  "talkingPoints":    ["max 5, one sentence each. Every one must reference a specific, current fact you found — not a generality."],
  "questionsToAsk":   ["max 5, one sentence each. Nothing answerable from the homepage."],
  "watchOuts":        ["max 4, dated and neutral: public criticism, layoffs, turnover, funding or regulatory pressure. Empty list if the research found none — do not invent balance."],
  "whyYouFit":        ["max 4 honest connections between this candidate's background and this company. Empty list if no CV was provided."]
}

Rules:
— Speed matters as much as depth. A handful of well-chosen searches, then write.
— interviewProcess: describe what candidates report, not what you assume. Say "reported" or "per Glassdoor" where that is the source.
— talkingPoints are the highest-value field. A point that would work for any company in the industry is a failed point.
— whyYouFit must be grounded in the candidate material provided. If none was provided, return an empty list rather than inventing a background.
${RESEARCH_RULES}`

export default createAIRoute({
  name:   'company-interview',
  schema: companyBriefRequestSchema,

  async run({ body, apiKey }) {
    const sections: string[] = [`Company: ${body.companyName}`]

    if (body.hint) sections.push(`Disambiguator: ${body.hint}`)
    if (body.roleTitle) {
      sections.push(
        `Interviewing for: ${body.roleTitle}. Weight the hiring-loop research toward that role and team.`,
      )
    }

    const candidate = candidateBlock(body.candidate)
    if (candidate) sections.push(candidate)
    else sections.push('No candidate CV was provided — return whyYouFit as an empty list.')

    const system = SYSTEM + localeSystemSuffix(body.locale)

    if (body.stage === 'structure') {
      const data = await structureResearch({
        apiKey,
        system,
        research:  body.research ?? '',
        schema:    companyInterviewResponseSchema,
        maxTokens: 9_000,
      })
      return { data }
    }

    const { research, sources } = await researchGrounded({
      apiKey,
      system,
      user:      sections.join('\n\n'),
      maxTokens: 9_000,
    })

    if (body.stage === 'research') return { data: null, research, sources }

    const data = await structureResearch({
      apiKey, system, research, schema: companyInterviewResponseSchema, maxTokens: 9_000,
    })
    return { data, sources }
  },
})
