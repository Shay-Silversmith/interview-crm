// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/[tool].ts
// One serverless function for every /api/ai/* route.
//
// The Hobby plan allows 12 serverless functions per deployment, and one file
// per tool went over that as the research tools were split into halves — the
// deployment stopped building entirely. Vercel counts FILES, not requests, so
// the routes live under _routes/ (a leading underscore keeps a directory out of
// the function count) and this single catch-all dispatches to them.
//
// This costs nothing that mattered. Each HTTP request is still its own
// invocation with its own timeout, so the parallel halves keep their separate
// clocks; the URLs are unchanged, so no client code moves. The only thing that
// changed is how many files Vercel has to turn into functions.
// ---------------------------------------------------------------------------

import type { VercelRequest, VercelResponse } from '@vercel/node'

import agent            from './_routes/agent.js'
import companyBrief     from './_routes/company-brief.js'
import companyFill      from './_routes/company-fill.js'
import companyInterview from './_routes/company-interview.js'
import cvParse          from './_routes/cv-parse.js'
import followUp         from './_routes/follow-up.js'
import interviewDebrief from './_routes/interview-debrief.js'
import jdParser         from './_routes/jd-parser.js'
import jdSummarize      from './_routes/jd-summarize.js'
import prepPack         from './_routes/prep-pack.js'
import prepPlan         from './_routes/prep-plan.js'
import starAnswers      from './_routes/star-answers.js'
import testKey          from './_routes/test-key.js'

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>

/** URL segment → handler. Keys are the public paths and must not be renamed. */
const ROUTES: Record<string, Handler> = {
  'agent':             agent,
  'company-brief':     companyBrief,
  'company-fill':      companyFill,
  'company-interview': companyInterview,
  'cv-parse':          cvParse,
  'follow-up':         followUp,
  'interview-debrief': interviewDebrief,
  'jd-parser':         jdParser,
  'jd-summarize':      jdSummarize,
  'prep-pack':         prepPack,
  'prep-plan':         prepPlan,
  'star-answers':      starAnswers,
  'test-key':          testKey,
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw  = req.query.tool
  const tool = Array.isArray(raw) ? raw[0] : raw

  const route = tool ? ROUTES[tool] : undefined
  if (!route) {
    res.setHeader('Access-Control-Allow-Origin',  '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key')
    return res.status(404).json({
      ok:    false,
      error: `No AI route named "${tool ?? ''}". Available: ${Object.keys(ROUTES).join(', ')}.`,
    })
  }

  return route(req, res)
}
