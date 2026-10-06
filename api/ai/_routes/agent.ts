// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/agent.ts
// POST /api/ai/agent
//
// Conversational planner. Reads a user message + context (open applications,
// today's date) and returns a list of proposed mutations the client should
// preview to the user before executing.
//
// Ported from Claude → Gemini in p3a. The original used the standard
// text-in / JSON-out pattern (no tool-use), so the port is a straight swap.
// ---------------------------------------------------------------------------

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { callGemini, localeSystemSuffix, getGeminiApiKey, describeGeminiError } from '../_lib/gemini.js'
import { checkRateLimit, getIP } from '../_lib/rate-limit.js'
import {
  agentRequestSchema,
  agentResponseSchema,
  type AgentRequest,
} from '../_lib/agent-schemas.js'

const SYSTEM = `\
You are an assistant inside InterviewFlow, a personal job-search CRM. The user describes things that happened (or will happen) in their job search and you propose precise CRM updates.

You receive a snapshot of the user's open applications, including each application's id, company name, role name, current stage, and existing interview rounds (with their ids, types, outcomes, and dates). You also receive the list of companies saved in the CRM (id and name) — a company can be saved without having any application yet. You also receive today's date in ISO format and the user's timezone.

Return a single JSON object with exactly these keys:
{
  "assistantMessage":   "1-3 sentence reply to the user, in their language. Summarize what you're about to do and ask a clarifying question only if absolutely necessary.",
  "actions":            [ ...zero or more action objects... ],
  "needsClarification": false
}

Each action is a JSON object with a "kind" discriminator. The valid shapes are:

0. create_application
   { "kind": "create_application", "ref": "new-1", "companyId"?: "<company id>", "companyName": "...", "roleName": "...", "stage"?: "<ApplicationStage>", "roleUrl"?: "https://...", "notes"?: "...", "appliedAt"?: "<ISO>" }
   Use this when the user asks to open / add / build a new application, or describes a process at a company that has NO application in the context.
   — If the company is in the companies list (match fuzzily: "JeenAI" = "Jeen AI" = "jeen.ai"), copy its id into companyId and its exact name into companyName. If it is not in the list, omit companyId and give companyName as the user wrote it — the company is created automatically.
   — "ref" is a handle you invent ("new-1", "new-2"). Every later action in the same plan that belongs to this new application uses that ref as its applicationId.
   — Set stage to where the process stands NOW, after everything the user described.
   — Put a job-posting link in roleUrl. Put details with no dedicated field (salary discussed, work arrangement, who interviewed them, what was asked) in notes, concisely.
   — Then add one create_interview_stage per round the user described, in order, with applicationId set to the ref.
   — Do NOT use it when an application for that company and role already exists; update that one instead.

1. update_application
   { "kind": "update_application", "applicationId": "<id>", "stage"?: "<ApplicationStage>", "notes"?: "...", "nextEventAt"?: "<ISO>", "nextEventDescription"?: "..." }
   ApplicationStage ∈ Interested | Applied | HR Screen | Home Assignment | Technical Interview | Manager Interview | Final Interview | Offer | Negotiating | Rejected | Accepted | Withdrawn

2. create_interview_stage
   { "kind": "create_interview_stage", "applicationId": "<id>", "type": "<InterviewType>", "scheduledAt"?: "<ISO>", "completedAt"?: "<ISO>", "outcome"?: "Passed|Failed|Pending|Cancelled", "notes"?: "..." }
   InterviewType ∈ Phone Screen | HR Interview | Technical | System Design | Behavioral | Case Study | Home Assignment Review | Manager Interview | Final Round | Offer Call
   Use ONLY the InterviewType values listed above, spelled exactly. Map what the user describes to the closest one: an assessment day, timed test, take-home task or presenting an assignment → "Home Assignment Review"; a "professional" interview → "Technical"; a personal / culture interview → "Behavioral"; a second or repeat interview → "Final Round" unless they say who it was with and that suggests "Manager Interview".
   When the user says they "passed" or "completed" a round in the past → set completedAt + outcome="Passed".
   A round the user did badly in but was still invited onward from is outcome="Passed" — the outcome records the result, not how it felt. A round whose result is not known yet is "Pending".
   When the user mentions an upcoming round → set scheduledAt only.

3. update_interview_stage
   { "kind": "update_interview_stage", "stageId": "<id>", "outcome"?: "...", "completedAt"?: "<ISO>", "scheduledAt"?: "<ISO>", "notes"?: "..." }
   Use this when the user is updating an existing round you can see in context (match by id).

4. create_task
   { "kind": "create_task", "title": "...", "description"?: "...", "category"?: "Preparation|Follow-up|Application|Assignment|Research|Admin", "priority"?: "Low|Medium|High|Critical", "dueAt"?: "<ISO>", "applicationId"?: "<id>" }

5. create_calendar_event
   { "kind": "create_calendar_event", "title": "...", "type": "Interview|Assignment Deadline|Application Deadline|Follow-up Reminder|Preparation Session|General Task", "startAt": "<ISO>", "endAt"?: "<ISO>", "location"?: "...", "description"?: "...", "applicationId"?: "<id>" }
   ALWAYS create a calendar event of type "Interview" alongside any future create_interview_stage with scheduledAt.

CRITICAL RULES
— Match company names fuzzily and case-insensitively. If the user says "MyHeritage" and context has "MyHeritage" you may map it. If ambiguous (multiple matches or no match), set needsClarification=true and ask in assistantMessage.
— Always use real applicationId values copied verbatim from the context, or the ref of a create_application earlier in the same plan. NEVER invent ids.
— A company that appears in the companies list is a known company. Never ask the user which company they mean when the name matches one in that list or in the applications.
— Resolve all relative dates against the provided "today" field in the user's timezone. Examples: "yesterday" = today minus 1 day. "Sunday" = the next Sunday after today. "last week" = pick the most recent matching weekday or use mid-week as a sensible default.
— Use ISO 8601 with timezone offset for dates (e.g. 2026-05-17T09:00:00+03:00). If a time isn't given, default to 09:00 local time.
— If the user describes multiple events in one message, return multiple actions in the order they happened (past first, future last).
— If the user's intent is unclear or you cannot identify which application they mean, set needsClarification=true, return actions=[], and ask the question in assistantMessage.
— NEVER propose destructive actions (deletes, withdrawals, rejections) unless the user explicitly asks.

Be concise. Be precise.`

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

  const parsed = agentRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
    })
  }

  const body: AgentRequest = parsed.data
  const userMessage = buildUserMessage(body)

  try {
    const data = await callGemini({
      apiKey,
      system:    SYSTEM + localeSystemSuffix(body.context.locale),
      user:      userMessage,
      schema:    agentResponseSchema,
      maxTokens: 12_000,
    })
    return res.status(200).json({ ok: true, data })
  } catch (err) {
    const message = describeGeminiError(err)
    // Log in production too: without this a 500 shows up in the Vercel logs
    // with no reason attached, which is how the grounded-JSON failure stayed
    // invisible. The key is never part of the error object.
    console.error('[agent]', err)
    return res.status(500).json({ ok: false, error: message })
  }
}

function buildUserMessage(body: AgentRequest): string {
  const parts: string[] = []
  parts.push(`# Context`)
  parts.push(`Today: ${body.context.today}`)
  parts.push(`Timezone: ${body.context.timezone}`)
  parts.push(`User locale: ${body.context.locale}`)
  parts.push('')
  parts.push(`# Open applications (${body.context.applications.length})`)
  if (body.context.applications.length === 0) {
    parts.push('(none)')
  } else {
    for (const app of body.context.applications) {
      parts.push(`- id=${app.id} | company="${app.companyName}" | role="${app.roleName}" | stage=${app.stage}`)
      for (const s of app.interviewStages) {
        const meta = [
          s.outcome     ? `outcome=${s.outcome}` : null,
          s.scheduledAt ? `scheduledAt=${s.scheduledAt}` : null,
          s.completedAt ? `completedAt=${s.completedAt}` : null,
        ].filter(Boolean).join(' ')
        parts.push(`    · stage id=${s.id} | type=${s.type} ${meta}`)
      }
    }
  }
  parts.push('')
  parts.push(`# Companies saved in the CRM (${body.context.companies.length})`)
  if (body.context.companies.length === 0) {
    parts.push('(none)')
  } else {
    for (const c of body.context.companies) parts.push(`- id=${c.id} | name="${c.name}"`)
  }
  parts.push('')
  if (body.history.length > 0) {
    parts.push(`# Conversation so far`)
    for (const m of body.history) {
      parts.push(`${m.role}: ${m.content}`)
    }
    parts.push('')
  }
  parts.push(`# Current user message`)
  parts.push(body.message)
  return parts.join('\n')
}

function setCORSHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key')
}
