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

Return a single JSON object with exactly these keys:
{
  "headline":     "one sentence a candidate could say out loud that proves they did the reading — specific, current, not a slogan",
  "whatTheyDo":   "3-5 sentences in plain language. What is the actual product, who uses it, what problem does it solve. Assume the reader has never used it.",
  "products":     ["main products or business lines, each with one clause of explanation"],
  "businessModel":"how the money actually works — who pays, for what, on what model",
  "customers":    "who the customers are: segments, named logos if public, B2B vs B2C",
  "scale":        "headcount, revenue or funding, public or private, key offices — each figure only if a search result gave it, with the figure's date or vintage",
  "recentNews":   [ { "date": "YYYY-MM or YYYY-MM-DD", "item": "what happened", "whyItMatters": "why a candidate should care in the interview" } ],
  "competitors":  ["who they compete with, and one clause on how they differ"],
  "culture":      ["culture signals from real sources: their own engineering blog, reviews, published values. Say where each came from."],
  "interviewProcess": ["what the hiring loop looks like for this kind of role, per public accounts (Glassdoor, Levels.fyi, candidate write-ups). Include round names and rough counts. If nothing public was found, return one item saying so."],
  "localPresence":"the company's Israel presence if any — office, which teams sit there, R&D vs sales. null if none or not established.",
  "techStack":    ["technologies the company is publicly known to use"],
  "talkingPoints":["4-6 lines that connect something specific and current about the company to the conversation. Each must reference a fact from the research, not a generality."],
  "questionsToAsk":["4-6 questions that could only be asked by someone who read this brief. No questions answerable from the homepage."],
  "watchOuts":    ["public criticism, layoffs, turnover, regulatory or funding pressure — stated neutrally and dated. Empty list if the research found none; do not invent balance."],
  "whyYouFit":    ["only if a candidate CV was provided: 3-5 honest connections between their background and this company. Empty list otherwise."],
  "disambiguation":"only when several companies share the name and you had to pick one — say which you researched and how to correct it. Otherwise null."
}

Rules:
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
      maxTokens: 24_000,
      urls:      body.urls,
    })

    return { data, sources }
  },
})
