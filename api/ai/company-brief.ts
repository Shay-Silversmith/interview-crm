// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/company-brief.ts
// POST /api/ai/company-brief
//
// The interview-facing company research report: what the company does, how it
// makes money, what changed recently, what the hiring loop looks like, and
// what to say to show you did the reading.
//
// Distinct from company-fill, which fills CRM columns. This one is the thing a
// candidate reads the night before, so it runs grounded in Google Search and
// returns its sources — an interview brief nobody can check is a liability.
// ---------------------------------------------------------------------------

import { callGeminiGrounded, localeSystemSuffix } from './_lib/gemini.js'
import { createAIRoute } from './_lib/handler.js'
import { candidateBlock, RESEARCH_RULES } from './_lib/prompt.js'
import { companyBriefRequestSchema, companyBriefResponseSchema } from './_lib/schemas.js'

const SYSTEM = `\
You research companies for a candidate who has an interview coming up, often tomorrow. You have Google Search. Use it.

Return a single JSON object with exactly these keys. Respect every length cap —
this is read on a phone the night before, and a brief nobody finishes is a brief
that did not work:
{
  "headline":     "ONE sentence a candidate could say out loud that proves they did the reading — specific, current, not a slogan",
  "whatTheyDo":   "3-4 sentences, plain language: the actual product, who uses it, what problem it solves",
  "products":     ["max 5. Name plus one short clause."],
  "businessModel":"2 sentences max — who pays, for what, on what model",
  "customers":    "1-2 sentences: segments, named logos if public, B2B vs B2C",
  "scale":        "1-2 sentences: headcount, funding or revenue, public or private, key offices. Only figures a search result gave you, each with its date.",
  "recentNews":   [ { "date": "YYYY-MM", "item": "one sentence", "whyItMatters": "one short clause" } ],
  "competitors":  ["max 4. Name plus one clause on how they differ."],
  "culture":      ["max 4. Each must name its source, e.g. 'per their engineering blog'."],
  "interviewProcess": ["max 5. The hiring loop for this kind of role per public accounts (Glassdoor, Levels.fyi, candidate write-ups) — round names and rough counts. If nothing public was found, return one item saying so."],
  "localPresence":"1-2 sentences on the Israel presence — office, which teams, R&D vs sales. null if none or not established.",
  "techStack":    ["max 8, names only"],
  "talkingPoints":["max 5, one sentence each. Every one must reference a specific fact from the research, not a generality."],
  "questionsToAsk":["max 5, one sentence each. Nothing answerable from the homepage."],
  "watchOuts":    ["max 4, dated and neutral. Empty list if the research found none — do not invent balance."],
  "whyYouFit":    ["max 4, only if a candidate CV was provided. Empty list otherwise."],
  "disambiguation":"only when several companies share the name and you had to pick one. Otherwise null."
}

Rules:
— Keep it tight. Every field has a cap above; going over is a failure, not thoroughness.
— Budget your searches: a handful of good queries, not an exhaustive sweep. Speed matters here.
— recentNews is the highest-value field and the easiest to get wrong. Only include items you can date. Prefer the last 12 months. An undated item is worse than no item.
— interviewProcess: describe what candidates report, not what you assume. Say "reported" or "per Glassdoor" where that is the source.
— Never state a headcount, valuation, funding round, or rating that no search result gave you.
— Write for someone who will be quizzed on this tomorrow: concrete nouns, real numbers, no marketing language.
${RESEARCH_RULES}`

export default createAIRoute({
  name:   'company-brief',
  schema: companyBriefRequestSchema,

  async run({ body, apiKey }) {
    const sections: string[] = [`Company to research: ${body.companyName}`]

    if (body.hint)      sections.push(`Disambiguator: ${body.hint}`)
    if (body.roleTitle) {
      sections.push(
        `The candidate is interviewing for: ${body.roleTitle}. ` +
        'Weight the research toward what matters for that role and that team.',
      )
    }
    if (body.urls?.length) {
      sections.push(`Read these pages directly as well:\n${body.urls.join('\n')}`)
    }

    const candidate = candidateBlock(body.candidate)
    if (candidate) sections.push(candidate)
    else sections.push('No candidate CV was provided — return whyYouFit as an empty list.')

    const { data, sources } = await callGeminiGrounded({
      apiKey,
      system:    SYSTEM + localeSystemSuffix(body.locale),
      user:      sections.join('\n\n'),
      schema:    companyBriefResponseSchema,
      // The brief is the longest output in the app and the one users read
      // end to end. Truncating it halfway is worse than a slower response.
      maxTokens: 14_000,
      urls:      body.urls,
    })

    return { data, sources }
  },
})
