// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/star-answers.ts
// POST /api/ai/star-answers
//
// Generates the behavioural questions this role is likely to ask, and a STAR
// answer for each, built from the candidate's actual CV.
//
// Every answer carries a `basedOn` field naming the CV item it was built from.
// That field is the safety mechanism: a STAR story the candidate cannot trace
// back to something they really did is a story they will get caught in, and
// making the provenance visible is what stops the tool from quietly inventing
// a career.
// ---------------------------------------------------------------------------

import {
  callGemini,
  callGeminiGrounded,
  localeSystemSuffix,
  LIGHT_THINKING,
} from '../_lib/gemini.js'
import { createAIRoute } from '../_lib/handler.js'
import { candidateBlock, GROUNDING_RULES } from '../_lib/prompt.js'
import { starAnswersRequestSchema, starAnswersResponseSchema } from '../_lib/schemas.js'

const SYSTEM = `\
You are an interview coach who builds STAR answers out of a candidate's real history. You never invent experience.

Return a single JSON object with exactly this shape:
{
  "answers": [
    {
      "question":     "the behavioural question, phrased the way an interviewer would actually ask it",
      "whyAsked":     "one sentence on why this role and company make this question likely",
      "basedOn":      "the specific CV item, project, or piece of background this story is built from — name it. If the CV does not support a real story, write: 'No CV evidence — outline only, fill in from your own experience.'",
      "situation":    "the context. 2-3 sentences. Concrete: where, when, who, what was at stake.",
      "task":         "what the candidate specifically was responsible for. Their scope, not the team's.",
      "action":       "what they actually did, in first person, step by step. This is the longest part — 4-6 sentences. Emphasise decisions and trade-offs, not activity.",
      "result":       "the outcome, quantified where the CV gives a number. If no number exists, describe the outcome qualitatively and do NOT invent a percentage.",
      "spokenAnswer": "the whole story as it would be said out loud in 60-90 seconds. Natural speech, first person, no bullet points, no headings.",
      "deliveryTips": ["2-4 notes on delivery: what to lead with, what to cut if short on time, the follow-up they should expect"],
      "followUps":    ["2-3 follow-up questions an interviewer would probe with after this answer"]
    }
  ],
  "coverageNote": "set this when the CV was too thin to ground the requested number of stories honestly — say which questions came out as outlines rather than real stories. null when every answer is grounded."
}

Rules:
— NEVER invent a project, employer, metric, or outcome. Every story must trace to something in the candidate's CV or background.
— If the CV cannot support a question honestly, still include the question, but make situation/task/action a scaffold with clear placeholders like "[the project where you...]", set basedOn to say there is no CV evidence, and record it in coverageNote. An outline the candidate fills in is useful; a fabricated story is not.
— Numbers: use only numbers that appear in the candidate's material. Never generate a plausible-looking percentage.
— Vary the stories. Do not build every answer from the same project.
— Write action in first person singular. "I decided", not "the team decided" — interviewers probe for individual contribution.
— Match the questions to the role: a data role gets data questions, a PM role gets prioritisation and stakeholder questions.
${GROUNDING_RULES}`

export default createAIRoute({
  name:   'star-answers',
  schema: starAnswersRequestSchema,

  async run({ body, apiKey }) {
    const sections: string[] = [
      `Role: ${body.role}`,
      `Company: ${body.company}`,
    ]

    if (body.focus) {
      sections.push(
        `Behavioural themes to bias toward: ${body.focus}\n` +
        'Map at least one question to each theme where the CV allows it.',
      )
    }

    const candidate = candidateBlock(body.candidate)
    if (candidate) sections.push(candidate)
    else {
      sections.push(
        'NO CANDIDATE CV WAS PROVIDED. Return every answer as a clearly-marked outline with placeholders, ' +
        'and say so in coverageNote. Do not invent a background.',
      )
    }

    if (body.question?.trim()) {
      sections.push(
        `The candidate asked for an answer to this specific question:\n"${body.question.trim()}"\n` +
        'Return exactly one answer, for that question.',
      )
    } else {
      sections.push(
        `Generate ${body.count ?? 4} of the most likely behavioural questions for this role, and answer each.`,
      )
    }

    const system = SYSTEM + localeSystemSuffix(body.locale)

    if (body.jdText?.trim()) {
      sections.push(`JOB DESCRIPTION:\n${body.jdText.trim()}`)
    }

    // A URL needs the tool-enabled path so the posting can actually be read.
    if (body.jdUrl && !body.jdText?.trim()) {
      sections.push(
        `JOB POSTING URL (read this page for the role's real requirements): ${body.jdUrl}\n` +
        'If the page cannot be read, work from the role title and company alone.',
      )
      const { data, sources } = await callGeminiGrounded({
        apiKey,
        system,
        user:      sections.join('\n\n'),
        schema:    starAnswersResponseSchema,
        maxTokens: 14_000,
        urls:      [body.jdUrl],
      })
      return { data, sources }
    }

    const data = await callGemini({
      apiKey,
      system,
      user:           sections.join('\n\n'),
      schema:         starAnswersResponseSchema,
      // Full STAR plus a spoken version for several questions is long output.
      maxTokens:      12_000,
      thinkingBudget: LIGHT_THINKING,
    })
    return { data }
  },
})
