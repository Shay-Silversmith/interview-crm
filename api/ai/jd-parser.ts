// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/jd-parser.ts
// POST /api/ai/jd-parser
//
// Turns a job posting into a role analysis read against this candidate's CV.
//
// Two changes from the original: the posting can arrive as a URL (LinkedIn or
// a careers page) rather than pasted text, and the fit read is per-requirement
// instead of a paragraph. A vague "you're a good match" is not something you
// can prepare against; "requirement 3 is a gap, here is the honest framing" is.
// ---------------------------------------------------------------------------

import {
  callGemini,
  callGeminiGrounded,
  localeSystemSuffix,
  LIGHT_THINKING,
} from './_lib/gemini.js'
import { createAIRoute } from './_lib/handler.js'
import { candidateBlock, GROUNDING_RULES } from './_lib/prompt.js'
import { jdParserRequestSchema, jdParserResponseSchema } from './_lib/schemas.js'

const SYSTEM = `\
You are a precise job-search analyst helping one specific candidate decide how to approach one specific role.

Return a single JSON object with exactly these keys:
{
  "roleSummary":       "2-3 sentences: what the role actually is, which team, what it exists to do",
  "seniority":         "the real level implied by the posting, e.g. 'Student / internship', 'Junior (0-2 yrs)', 'Mid-level'. Say when the title and the requirements disagree.",
  "responsibilities":  ["5-8 specific duties, in the posting's own terms"],
  "requirements":      ["5-8 must-haves, each as its own testable item"],
  "niceToHaves":       ["preferred but not required"],
  "technologies":      ["tools, languages, platforms named in the posting"],
  "whatTheyWant":      "1-2 sentences on the profile they are really hiring for, including what the wording implies but does not say",
  "fitAnalysis": [
    {
      "requirement": "one requirement, quoted or closely paraphrased",
      "level":       "strong" | "partial" | "gap",
      "evidence":    "the specific thing in the candidate's CV or background that supports this rating — or, for a gap, what is missing and the honest way to address it in the room"
    }
  ],
  "howIMatch":         ["3-5 genuine points of alignment, each tied to something real in the candidate's history"],
  "gapsToAddress":     ["every gap worth preparing an answer for, with the framing to use — never advise hiding it"],
  "whatToEmphasize":   ["3-5 talking points, specific to this posting"],
  "possibleQuestions": ["5-7 questions this posting makes likely"],
  "prepChecklist":     ["5-8 concrete prep actions, each doable in an evening"],
  "sourceNote":        "only when the posting was read from a URL and something was wrong with it (paywalled, expired, redirected to a listings page) — otherwise null"
}

Rules:
— Ground every claim in the posting text. Do not invent technologies or requirements it does not mention.
— fitAnalysis must cover the requirements that matter most, not all of them. Rate honestly: "gap" is a useful answer and a candidate who is told everything is "strong" walks in unprepared.
— If no candidate background was provided, base fitAnalysis on the posting alone and set every evidence field to say that no CV was supplied.
— Keep each list item to one clear sentence.
${GROUNDING_RULES}`

export default createAIRoute({
  name:   'jd-parser',
  schema: jdParserRequestSchema,

  async run({ body, apiKey }) {
    const sections: string[] = []

    if (body.roleTitle)   sections.push(`Role title: ${body.roleTitle}`)
    if (body.companyName) sections.push(`Company: ${body.companyName}`)

    const candidate = candidateBlock(body.candidate, body.userBackground)
    if (candidate) sections.push(candidate)

    const system = SYSTEM + localeSystemSuffix(body.locale)

    // A URL means the posting has to be fetched, which needs the tool-enabled
    // path. Pasted text is the cheaper, more reliable route — prefer it, and
    // use both when the user supplied both.
    if (body.jdUrl) {
      sections.push(`JOB POSTING URL (read this page): ${body.jdUrl}`)
      if (body.jdText?.trim()) {
        sections.push(`The user also pasted this text from the posting:\n${body.jdText.trim()}`)
      }
      sections.push(
        'Read the posting at the URL. If the page cannot be read, is expired, or is a generic listings page rather than one job, ' +
        'set sourceNote to say exactly that and analyse whatever text was pasted instead. Do not fabricate a posting.',
      )

      const { data, sources } = await callGeminiGrounded({
        apiKey,
        system,
        user:           sections.join('\n\n'),
        schema:         jdParserResponseSchema,
        maxTokens:      10_000,
        thinkingBudget: LIGHT_THINKING,
        urls:           [body.jdUrl],
      })
      return { data, sources }
    }

    sections.push(`JOB DESCRIPTION:\n${body.jdText?.trim() ?? ''}`)

    const data = await callGemini({
      apiKey,
      system,
      user:           sections.join('\n\n'),
      schema:         jdParserResponseSchema,
      maxTokens:      9_000,
      thinkingBudget: LIGHT_THINKING,
    })
    return { data }
  },
})
