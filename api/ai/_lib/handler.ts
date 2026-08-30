// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/_lib/handler.ts
// One shape for every /api/ai/* route: CORS, method guard, BYOK key check,
// rate limit, request validation, and error translation.
//
// Each route had its own copy of this preamble, which is how the endpoints
// drifted apart — different token ceilings, different error wording, and one
// route logging a cause while its neighbour swallowed it. A route now supplies
// only the part that differs: its schema and what to do with the parsed body.
// ---------------------------------------------------------------------------

import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { z } from 'zod'
import { getGeminiApiKey, describeGeminiError } from './gemini.js'
import { checkRateLimit, getIP } from './rate-limit.js'

export interface AIRouteContext<TBody> {
  body:   TBody
  apiKey: string
}

export interface AIRouteConfig<TBody> {
  /** Route name, used only in server logs. */
  name:   string
  schema: z.ZodType<TBody>
  run:    (ctx: AIRouteContext<TBody>) => Promise<unknown>
}

export function createAIRoute<TBody>(config: AIRouteConfig<TBody>) {
  return async function handler(req: VercelRequest, res: VercelResponse) {
    setCORSHeaders(res)
    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' })
    }

    const headers = req.headers as Record<string, string | string[] | undefined>

    const apiKey = getGeminiApiKey(headers)
    if (!apiKey) {
      return res.status(401).json({
        ok:    false,
        error: 'No Gemini API key. Add one in Settings to use the AI tools.',
      })
    }

    const rl = checkRateLimit(getIP(headers))
    if (!rl.allowed) {
      return res.status(429).json({
        ok:    false,
        error: `Rate limit reached. Try again in ${Math.ceil(rl.resetInMs / 1000)} seconds.`,
      })
    }

    const parsed = config.schema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        ok:    false,
        error: parsed.error.issues
          .map(i => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message))
          .join('; '),
      })
    }

    try {
      const data = await config.run({ body: parsed.data, apiKey })
      // A route may return the payload directly, or an object that already
      // carries sibling fields (sources, warnings) alongside it.
      const payload =
        data && typeof data === 'object' && 'data' in (data as Record<string, unknown>)
          ? (data as Record<string, unknown>)
          : { data }
      return res.status(200).json({ ok: true, ...payload })
    } catch (err) {
      // Log the cause server-side; send the reader something they can act on.
      console.error(`[${config.name}]`, err)
      return res.status(500).json({ ok: false, error: describeGeminiError(err) })
    }
  }
}

export function setCORSHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key')
}
