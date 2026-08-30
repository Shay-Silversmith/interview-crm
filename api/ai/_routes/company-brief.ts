// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/company-brief.ts
// POST /api/ai/company-brief
//
// Half one of the company briefing: what the company actually is. The
// interview-facing half lives in company-interview.ts and is requested in
// parallel — see companyProfileResponseSchema for why the work is split.
//
// Everything here is grounded in Google Search and returns its sources. An
// interview brief nobody can check is a liability.
// ---------------------------------------------------------------------------

import { callGeminiGrounded, localeSystemSuffix } from '../_lib/gemini.js'
import { createAIRoute } from '../_lib/handler.js'
import { RESEARCH_RULES } from '../_lib/prompt.js'
import { companyBriefRequestSchema, companyProfileResponseSchema } from '../_lib/schemas.js'

const SYSTEM = `\
You research a company for a candidate who has an interview coming up, often tomorrow. You have Google Search. Use it, then answer fast.

Return a single JSON object with exactly these keys. The length caps are hard limits, not suggestions — this is read on a phone the night before:
{
  "headline":      "ONE sentence a candidate could say out loud that proves they did the reading — specific and current, not a slogan",
  "whatTheyDo":    "3-4 sentences, plain language: the actual product, who uses it, what problem it solves",
  "products":      ["max 5. Name plus one short clause."],
  "businessModel": "2 sentences max — who pays, for what, on what model",
  "customers":     "1-2 sentences: segments, named logos if public, B2B vs B2C",
  "scale":         "1-2 sentences: headcount, funding or revenue, public or private, key offices. Only figures a search result gave you, each with its date.",
  "recentNews":    [ { "date": "YYYY-MM", "item": "one sentence", "whyItMatters": "one short clause" } ],
  "competitors":   ["max 4. Name plus one clause on how they differ."],
  "localPresence": "1-2 sentences on the Israel presence — office, which teams, R&D vs sales. null if none or not established.",
  "techStack":     ["max 8, names only"],
  "disambiguation":"only when several companies share the name and you had to pick one. Otherwise null."
}

Rules:
— Speed matters as much as depth. Run a handful of well-chosen searches, not an exhaustive sweep, then write.
— recentNews: at most 4 items, each dated, preferring the last 12 months. Only include what you can date — an undated item is worse than no item.
— Never state a headcount, valuation, funding round, or rating that no search result gave you.
— Concrete nouns and real numbers. No marketing language.
${RESEARCH_RULES}`

export default createAIRoute({
  name:   'company-brief',
  schema: companyBriefRequestSchema,

  async run({ body, apiKey }) {
    const sections: string[] = [`Company to research: ${body.companyName}`]

    if (body.hint)      sections.push(`Disambiguator: ${body.hint}`)
    if (body.roleTitle) sections.push(`The candidate is interviewing for: ${body.roleTitle}.`)
    if (body.urls?.length) {
      sections.push(`Read these pages directly as well:\n${body.urls.join('\n')}`)
    }

    const { data, sources } = await callGeminiGrounded({
      apiKey,
      system:    SYSTEM + localeSystemSuffix(body.locale),
      user:      sections.join('\n\n'),
      schema:    companyProfileResponseSchema,
      // Half the fields of the original single call, so this fits the host's
      // function timeout with room to spare.
      maxTokens: 9_000,
      urls:      body.urls,
    })

    return { data, sources }
  },
})
