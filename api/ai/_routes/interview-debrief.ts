// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/interview-debrief.ts
// POST /api/ai/interview-debrief
//
// Unordered notes typed straight after an interview, out the other side as an
// organised record the candidate can reread before the next round.
//
// The hard rule here is fidelity. This is a record of what happened, so the
// model reorganises and clarifies, and never adds a question that was not
// asked or an answer that was not given. A debrief that quietly improves the
// candidate's answers is worse than no debrief: they will prepare for the next
// round against a conversation that did not happen.
// ---------------------------------------------------------------------------

import { callGemini, localeSystemSuffix, LIGHT_THINKING } from '../_lib/gemini.js'
import { createAIRoute } from '../_lib/handler.js'
import { candidateBlock } from '../_lib/prompt.js'
import {
  interviewDebriefRequestSchema,
  interviewDebriefResponseSchema,
} from '../_lib/schemas.js'

const SYSTEM = `\
You turn a candidate's raw, unordered notes from an interview they just finished into a clean written record.

The notes will be messy: fragments, no order, typos, half-sentences, mixed languages. That is expected. Your job is to organise, not to embellish.

Return a single JSON object with exactly these keys:
{
  "headline":  "one line: round, company, role, and how it went overall",
  "overview":  "3-5 sentences: what round this was, who was in it, how long, format, general arc of the conversation — from the notes only",
  "questionsAsked": [
    {
      "question":    "the question, cleaned up into a full sentence",
      "answerGiven": "what the candidate said they answered, faithful to the notes. Empty string if the notes do not say.",
      "assessment":  "how it landed, only if the notes indicate. Empty string otherwise. Never guess."
    }
  ],
  "topicsCovered":       ["subjects the conversation actually touched"],
  "learnedAboutRole":    ["facts about the role, team, stack, process, or company that came out of the conversation — this is the part people forget by the next round"],
  "wentWell":            ["what went well, per the notes"],
  "couldImprove":        ["specific, actionable weak points — from the notes, not general interview advice"],
  "unansweredQuestions": ["anything asked that the candidate could not answer or answered poorly. This is the study list for next time."],
  "signalsRead":         ["signals about how it went: interviewer reactions, timing, what they volunteered. Hedge honestly — 'they mentioned a next round', not 'it went great'."],
  "nextSteps":           ["what happens next, with who and when, as stated in the interview"],
  "followUpActions":     ["what the candidate should do now: thank-you note, sending something promised, studying a topic. Concrete and small."],
  "prepForNextRound":    ["what to prepare for the next round, based on what this one revealed"],
  "markdown":            "the whole debrief as clean markdown with ## headings, ready to paste into a notes app. Skip empty sections entirely."
}

Rules:
— FIDELITY IS THE POINT. Never add a question that is not in the notes. Never improve an answer the candidate gave. Never invent an interviewer reaction.
— Where the notes are ambiguous, keep the ambiguity: "unclear from notes whether this was asked directly".
— Fix grammar, spelling, and fragments into readable sentences. That is cleanup, not invention.
— Leave a list empty rather than filling it. An empty "wentWell" is real information.
— couldImprove and unansweredQuestions must come from the notes. Do not append generic interview advice.
— The markdown field must contain the same content as the structured fields, formatted for reading. Do not put anything in it that is not in the fields above.`

export default createAIRoute({
  name:   'interview-debrief',
  schema: interviewDebriefRequestSchema,

  async run({ body, apiKey }) {
    const header: string[] = []
    if (body.company)       header.push(`Company: ${body.company}`)
    if (body.role)          header.push(`Role: ${body.role}`)
    if (body.interviewType) header.push(`Interview type: ${body.interviewType}`)
    if (body.interviewer)   header.push(`Interviewer: ${body.interviewer}`)
    if (body.interviewedAt) header.push(`Date: ${body.interviewedAt}`)

    const sections: string[] = []
    if (header.length) sections.push(header.join('\n'))

    const candidate = candidateBlock(body.candidate)
    if (candidate) {
      sections.push(
        `${candidate}\n\n(Candidate context is for understanding references in the notes only. ` +
        'Do not use it to add content to the debrief.)',
      )
    }

    sections.push(`RAW NOTES FROM THE INTERVIEW:\n${body.notes.trim()}`)

    const data = await callGemini({
      apiKey,
      system:         SYSTEM + localeSystemSuffix(body.locale),
      user:           sections.join('\n\n'),
      schema:         interviewDebriefResponseSchema,
      maxTokens:      12_000,
      thinkingBudget: LIGHT_THINKING,
    })

    return { data }
  },
})
