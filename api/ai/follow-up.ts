// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/follow-up.ts
// POST /api/ai/follow-up
//
// Drafts three variants of a professional follow-up message using Gemini.
// ---------------------------------------------------------------------------

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { callGemini, localeSystemSuffix, getGeminiApiKey } from './_lib/gemini.js'
import { checkRateLimit, getIP } from './_lib/rate-limit.js'
import {
  followUpRequestSchema,
  followUpResponseSchema,
  type FollowUpRequest,
} from './_lib/schemas.js'

const SYSTEM = `\
You are an expert professional communications writer. Draft follow-up messages that are genuine, specific, and effective.

Return a single JSON object with exactly these keys:
{
  "short":    "Concise version — maximum 80 words. Direct and punchy.",
  "warm":     "Personal version — 4-6 sentences, maximum 150 words. Warmer tone, still professional.",
  "linkedIn": "LinkedIn DM version — maximum 300 characters, casual but professional."
}

Hard rules:
— Reference specific details from the context. Never write a template-sounding message.
— Never open with: "I hope this finds you well", "I wanted to reach out", "Just checking in", or similar openers.
— Never close with: "Please don't hesitate to reach out" or "Looking forward to hearing from you" as a standalone line.
— post-interview: reference something concrete from the conversation or topic discussed.
— ping-after-silence: be politely direct; do not be apologetic for following up.
— thank-you: mention something specific about what was said or done that you're grateful for.
— decline-politely: be gracious, specific, and leave the relationship door open.
— Match the tone requested (professional = crisp and formal; warm = genuine and personal; casual = conversational).
— All three variants should feel written by the same authentic person, just pitched differently.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCORSHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const headers = req.headers as Record<string, string | string[] | undefined>
  const apiKey = getGeminiApiKey(headers)
  if (!apiKey) {
    return res.status(401).json({ ok: false, error: 'Gemini API key required. Set it in Settings → AI Preferences.' })
  }

  const ip = getIP(headers)
  const rl = checkRateLimit(ip)
  if (!rl.allowed) {
    return res.status(429).json({
      ok: false,
      error: `Rate limit reached. Try again in ${Math.ceil(rl.resetInMs / 1000)} seconds.`,
    })
  }

  const parsed = followUpRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues.map(i => i.message).join('; '),
    })
  }

  const body: FollowUpRequest = parsed.data
  const messageTypeLabels: Record<FollowUpRequest['messageType'], string> = {
    'post-interview':      'Post-interview follow-up',
    'ping-after-silence':  'Follow-up after no response',
    'thank-you':           'Thank-you message',
    'decline-politely':    'Polite decline',
  }
  const userMessage = [
    `Message type: ${messageTypeLabels[body.messageType]}`,
    `Recipient: ${body.contactName} at ${body.company}`,
    `Role being discussed: ${body.role}`,
    `Requested tone: ${body.tone}`,
    `Context:\n${body.context}`,
  ].join('\n\n')

  try {
    const data = await callGemini({
      apiKey,
      system:    SYSTEM + localeSystemSuffix(body.locale),
      user:      userMessage,
      schema:    followUpResponseSchema,
      maxTokens: 1200,
    })
    return res.status(200).json({ ok: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    // Log in production too: without this a 500 shows up in the Vercel logs
    // with no reason attached, which is how the grounded-JSON failure stayed
    // invisible. The key is never part of the error object.
    console.error('[follow-up]', err)
    return res.status(500).json({ ok: false, error: message })
  }
}

function setCORSHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key')
}
