// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/follow-up.ts
// POST /api/ai/follow-up
//
// Three drafts of the same follow-up message: a short email, a warmer email,
// and a LinkedIn message that fits the character limit.
// ---------------------------------------------------------------------------

import { callGemini, localeSystemSuffix, LIGHT_THINKING } from '../_lib/gemini.js'
import { createAIRoute } from '../_lib/handler.js'
import { candidateBlock, GROUNDING_RULES } from '../_lib/prompt.js'
import { followUpRequestSchema, followUpResponseSchema } from '../_lib/schemas.js'

const SYSTEM = `\
You write follow-up messages for a candidate in a hiring process. The messages get sent as-is, so they must be ready to send.

Return a single JSON object with exactly these keys:
{
  "subject":  "email subject line for the short and warm variants — specific, under 60 characters, no 'Following up' alone",
  "short":    "a tight email. 3-5 sentences. Greeting, the point, one specific reference to the conversation, a clear ask, sign-off.",
  "warm":     "the same message with more warmth and one extra beat of genuine specificity. Still under 150 words.",
  "linkedIn": "a LinkedIn message under 280 characters. No subject line, no formal sign-off — LinkedIn is a chat window."
}

Rules:
— Reference something specific from the context given. A follow-up with nothing specific in it reads as a template, which is worse than sending nothing.
— Never invent details about the conversation. If the context is thin, keep the message short and general rather than inventing a moment that did not happen.
— No flattery, no "I am writing to express my enthusiasm", no "I hope this email finds you well".
— Match the requested tone, but never let casual become unprofessional.
— Address the contact by name when one is given. When the name is a placeholder like "Hiring Team", write a greeting that works without a name.
— Leave no bracketed placeholders in the output. The candidate should be able to send it without editing.
— The candidate signs off with their own name; end with a sign-off line and their name if one was provided.
${GROUNDING_RULES}`

const TYPE_GUIDANCE: Record<string, string> = {
  'post-interview':
    'This is a post-interview follow-up. Thank them for the specific conversation, reinforce one point of fit, and ask about next steps and timing.',
  'ping-after-silence':
    'This is a nudge after silence. Be gracious, do not imply they were rude, restate continued interest in one clause, and ask for a status update with an easy out for them.',
  'thank-you':
    'This is a thank-you note. Gratitude first, one specific thing that stood out from the conversation, brief reinforcement of interest. No hard ask.',
  'decline-politely':
    'The candidate is withdrawing or declining. Be warm, brief, and final. Give a reason only in the most general terms, thank them genuinely, and leave the relationship open for the future. Do not ask for anything.',
}

export default createAIRoute({
  name:   'follow-up',
  schema: followUpRequestSchema,

  async run({ body, apiKey }) {
    const sections: string[] = [
      TYPE_GUIDANCE[body.messageType] ?? `Message type: ${body.messageType}`,
      `Company: ${body.company}`,
      `Role: ${body.role}`,
      `Recipient: ${body.contactName}${body.contactTitle ? ` (${body.contactTitle})` : ''}`,
      `Tone: ${body.tone}`,
    ]

    const candidate = candidateBlock(body.candidate)
    if (candidate) sections.push(candidate)

    if (body.context.trim()) {
      sections.push(`WHAT HAPPENED (use this for the specific reference):\n${body.context.trim()}`)
    } else {
      sections.push(
        'No context about the conversation was provided. Keep all three messages short and general ' +
        'rather than inventing a specific moment to reference.',
      )
    }

    const data = await callGemini({
      apiKey,
      system:         SYSTEM + localeSystemSuffix(body.locale),
      user:           sections.join('\n\n'),
      schema:         followUpResponseSchema,
      maxTokens:      8_000,
      thinkingBudget: LIGHT_THINKING,
    })

    return { data }
  },
})
