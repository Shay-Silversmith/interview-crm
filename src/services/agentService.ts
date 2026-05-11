// ---------------------------------------------------------------------------
// InterviewFlow — agentService.ts
// Client wrapper for the /api/ai/agent planner + executor that runs the
// proposed actions through the existing services.
//
// Two paths:
//   • Live  — when VITE_AI_ENABLED=true and /api/ai/agent is reachable.
//   • Mock  — deterministic rule-based fallback so the chat UX works even
//             without vercel dev / serverless functions. Clearly labelled
//             as "demo" in the assistant message.
// ---------------------------------------------------------------------------

import type { QueryClient } from '@tanstack/react-query'
import type {
  ApplicationStage, InterviewType, InterviewOutcome,
  TaskCategory, Priority, CalendarEventType,
} from '@/lib/enums'
import type { JobApplication } from '@/types'
import { applicationsService } from './applicationsService'
import { interviewStageService } from './interviewStageService'
import { tasksService } from './tasksService'
import { calendarService } from './calendarService'
import { isAIEnabled } from '@/lib/env'
import { QK } from '@/lib/query-keys'
import { getStoredApiKey, isDemoMode } from './aiClientService'

// ---------------------------------------------------------------------------
// Action types — must match api/ai/_lib/agent-schemas.ts
// ---------------------------------------------------------------------------

export type AgentAction =
  | {
      kind: 'update_application'
      applicationId: string
      stage?: ApplicationStage
      notes?: string
      nextEventAt?: string
      nextEventDescription?: string
    }
  | {
      kind: 'create_interview_stage'
      applicationId: string
      type: InterviewType
      scheduledAt?: string
      completedAt?: string
      outcome?: InterviewOutcome
      notes?: string
    }
  | {
      kind: 'update_interview_stage'
      stageId: string
      outcome?: InterviewOutcome
      completedAt?: string
      scheduledAt?: string
      notes?: string
    }
  | {
      kind: 'create_task'
      title: string
      description?: string
      category?: TaskCategory
      priority?: Priority
      dueAt?: string
      applicationId?: string
    }
  | {
      kind: 'create_calendar_event'
      title: string
      type: CalendarEventType
      startAt: string
      endAt?: string
      location?: string
      description?: string
      applicationId?: string
    }

export interface AgentMessage {
  role:    'user' | 'assistant'
  content: string
}

export interface AgentPlan {
  assistantMessage:   string
  actions:            AgentAction[]
  needsClarification: boolean
  /** True when this plan came from the deterministic mock, not Claude. */
  isMock?: boolean
}

export interface AgentRequestContext {
  today:        string                   // ISO datetime
  timezone:     string                   // e.g. 'Asia/Jerusalem'
  locale:       'en' | 'he'
  applications: JobApplication[]
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Plan: send the user's message + context to the AI agent (or mock)
 * and get back proposed actions.
 */
export async function planAgentActions(
  message:  string,
  history:  AgentMessage[],
  context:  AgentRequestContext,
): Promise<AgentPlan> {
  if (!isAIEnabled()) return mockPlan(message, context)
  if (isDemoMode()) return { ...mockPlan(message, context), assistantMessage: `(Demo mode — connect a Claude API key in Settings for live AI.)\n\n${mockPlan(message, context).assistantMessage}` }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const userKey = getStoredApiKey()
  if (userKey) headers['x-anthropic-key'] = userKey

  try {
    const res = await fetch('/api/ai/agent', {
      method:  'POST',
      headers,
      body:    JSON.stringify({
        message,
        history,
        context: {
          today:    context.today,
          timezone: context.timezone,
          locale:   context.locale,
          applications: context.applications.map(a => ({
            id:           a.id,
            companyName:  a.companyName,
            roleName:     a.roleName,
            stage:        a.stage,
            interviewStages: a.interviewStages.map(s => ({
              id:          s.id,
              type:        s.type,
              outcome:     s.outcome,
              scheduledAt: s.scheduledAt,
              completedAt: s.completedAt,
            })),
          })),
        },
      }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => null) as { error?: string } | null
      throw new Error(json?.error ?? `HTTP ${res.status}`)
    }

    const json = await res.json() as { ok: true, data: AgentPlan } | { ok: false, error: string }
    if (!json.ok) throw new Error(json.error)
    return json.data
  } catch (err) {
    // Network / function-not-deployed → graceful demo fallback so the UX still works
    const note = err instanceof Error ? err.message : 'unknown error'
    const plan = mockPlan(message, context)
    return {
      ...plan,
      assistantMessage:
        `(Live AI unavailable — ${note}. Showing demo plan.)\n\n` + plan.assistantMessage,
    }
  }
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export interface ExecutionResult {
  action:  AgentAction
  ok:      boolean
  error?:  string
  /** Free-text summary of what happened — used in toasts and the chat log. */
  summary: string
}

/**
 * Execute a list of agent actions sequentially, invalidating React Query
 * caches afterwards so the rest of the app reflects the changes.
 */
export async function executeAgentActions(
  actions:     AgentAction[],
  queryClient: QueryClient,
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = []

  for (const action of actions) {
    try {
      const summary = await runOne(action)
      results.push({ action, ok: true, summary })
    } catch (err) {
      results.push({
        action,
        ok:      false,
        error:   err instanceof Error ? err.message : 'Unknown error',
        summary: describeAction(action),
      })
    }
  }

  // Broad invalidation — cheap and keeps the UI consistent.
  queryClient.invalidateQueries({ queryKey: QK.applications.all() })
  queryClient.invalidateQueries({ queryKey: QK.tasks.all() })
  queryClient.invalidateQueries({ queryKey: QK.calendar.all() })
  queryClient.invalidateQueries({ queryKey: QK.dashboard.all() })

  return results
}

async function runOne(action: AgentAction): Promise<string> {
  switch (action.kind) {
    case 'update_application': {
      const patch: Partial<JobApplication> = {}
      if (action.stage !== undefined)                patch.stage = action.stage
      if (action.notes !== undefined)                patch.notes = action.notes
      if (action.nextEventAt !== undefined)          patch.nextEventAt = action.nextEventAt
      if (action.nextEventDescription !== undefined) patch.nextEventDescription = action.nextEventDescription
      const updated = await applicationsService.update(action.applicationId, patch)
      const bits: string[] = []
      if (action.stage) bits.push(`stage → ${action.stage}`)
      if (action.nextEventDescription) bits.push(`next: ${action.nextEventDescription}`)
      return `Updated ${updated.companyName} — ${bits.join(', ') || 'fields updated'}`
    }

    case 'create_interview_stage': {
      const stage = await interviewStageService.create({
        applicationId: action.applicationId,
        type:          action.type,
        scheduledAt:   action.scheduledAt,
        completedAt:   action.completedAt,
        outcome:       action.outcome ?? 'Pending',
        notes:         action.notes,
      })
      const when = action.completedAt ? ` (completed ${formatShortDate(action.completedAt)})`
                 : action.scheduledAt ? ` (scheduled ${formatShortDate(action.scheduledAt)})`
                 : ''
      const outcome = action.outcome && action.outcome !== 'Pending' ? ` — ${action.outcome}` : ''
      return `Added interview round: ${stage.type}${when}${outcome}`
    }

    case 'update_interview_stage': {
      const updated = await interviewStageService.update(action.stageId, {
        outcome:     action.outcome,
        completedAt: action.completedAt,
        scheduledAt: action.scheduledAt,
        notes:       action.notes,
      })
      return `Updated round "${updated.type}"${action.outcome ? ` → ${action.outcome}` : ''}`
    }

    case 'create_task': {
      const task = await tasksService.create({
        title:         action.title,
        description:   action.description,
        category:      action.category ?? 'Preparation',
        priority:      action.priority ?? 'Medium',
        status:        'Todo',
        dueAt:         action.dueAt,
        applicationId: action.applicationId,
      })
      return `Created task: ${task.title}${action.dueAt ? ` (due ${formatShortDate(action.dueAt)})` : ''}`
    }

    case 'create_calendar_event': {
      const event = await calendarService.create({
        title:         action.title,
        type:          action.type,
        startAt:       action.startAt,
        endAt:         action.endAt,
        location:      action.location,
        description:   action.description,
        applicationId: action.applicationId,
      })
      return `Scheduled: ${event.title} on ${formatShortDate(event.startAt)}`
    }
  }
}

// ---------------------------------------------------------------------------
// Human-readable description of an action — used in the preview card UI
// ---------------------------------------------------------------------------

export function describeAction(a: AgentAction): string {
  switch (a.kind) {
    case 'update_application': {
      const bits: string[] = []
      if (a.stage) bits.push(`stage → ${a.stage}`)
      if (a.notes) bits.push(`note added`)
      if (a.nextEventDescription) bits.push(`next: ${a.nextEventDescription}`)
      return `Update application: ${bits.join(', ') || 'no changes'}`
    }
    case 'create_interview_stage': {
      const when = a.completedAt ? `completed ${formatShortDate(a.completedAt)}`
                 : a.scheduledAt ? `on ${formatShortDate(a.scheduledAt)}`
                 : 'no date'
      const outcome = a.outcome && a.outcome !== 'Pending' ? ` (${a.outcome})` : ''
      return `Add round "${a.type}" — ${when}${outcome}`
    }
    case 'update_interview_stage': {
      const bits: string[] = []
      if (a.outcome)     bits.push(`outcome → ${a.outcome}`)
      if (a.completedAt) bits.push(`completed ${formatShortDate(a.completedAt)}`)
      if (a.scheduledAt) bits.push(`scheduled ${formatShortDate(a.scheduledAt)}`)
      return `Update round: ${bits.join(', ') || 'note'}`
    }
    case 'create_task':
      return `Task: "${a.title}"${a.dueAt ? ` — due ${formatShortDate(a.dueAt)}` : ''}`
    case 'create_calendar_event':
      return `Event: "${a.title}" — ${formatShortDate(a.startAt)}${a.location ? ` @ ${a.location}` : ''}`
  }
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

// ---------------------------------------------------------------------------
// Mock planner — enough to demo the UX without a live AI backend.
// Strategy: find the application the user is talking about, then map a few
// common Hebrew/English keywords to actions.
// ---------------------------------------------------------------------------

function mockPlan(message: string, ctx: AgentRequestContext): AgentPlan {
  const target = findApplicationInMessage(message, ctx.applications)

  if (!target) {
    return {
      assistantMessage:
        ctx.locale === 'he'
          ? 'לא מצאתי לאיזו הגשה את/ה מתכוון/ת. תוכל/י לנסח שוב עם שם החברה?'
          : "I couldn't tell which application you mean. Can you mention the company name?",
      actions:            [],
      needsClarification: true,
      isMock:             true,
    }
  }

  const actions: AgentAction[] = []
  const lower = message.toLowerCase()

  // Hebrew + English keywords for "passed phone screen / hr"
  if (/(phone|hr|שיחה ראשונית|ראשונית|hr screen)/i.test(message) && /(passed|עברתי)/i.test(message)) {
    actions.push({
      kind:          'create_interview_stage',
      applicationId: target.id,
      type:          'Phone Screen',
      completedAt:   isoDaysAgo(ctx.today, 14),
      outcome:       'Passed',
    })
  }

  // home assignment passed
  if (/(home assignment|עבודת בית|תרגיל|assignment)/i.test(message) && /(passed|עברתי|הגשתי)/i.test(message)) {
    actions.push({
      kind:          'create_interview_stage',
      applicationId: target.id,
      type:          'Home Assignment Review',
      completedAt:   isoDaysAgo(ctx.today, 5),
      outcome:       'Passed',
    })
  }

  // upcoming on-site / physical interview Sunday
  if (/(on-site|on site|פיזי|במשרד|בחברה|in person|onsite)/i.test(message)) {
    const sunday = isoNextWeekday(ctx.today, 0, 9, 0)
    actions.push({
      kind:          'create_interview_stage',
      applicationId: target.id,
      type:          'Manager Interview',
      scheduledAt:   sunday,
      outcome:       'Pending',
    })
    actions.push({
      kind:          'create_calendar_event',
      title:         `${target.companyName} — On-site interview`,
      type:          'Interview',
      startAt:       sunday,
      location:      target.companyName,
      applicationId: target.id,
    })
    actions.push({
      kind:          'update_application',
      applicationId: target.id,
      stage:         'Manager Interview',
      nextEventAt:   sunday,
      nextEventDescription: 'On-site interview',
    })
  }

  if (actions.length === 0) {
    return {
      assistantMessage:
        (ctx.locale === 'he'
          ? `מצאתי את ההגשה ל-${target.companyName} אבל לא הבנתי איזה שינוי לבצע. הוסף/י פרטים על השלב, התאריך או התוצאה.`
          : `Found your ${target.companyName} application but couldn't tell what to update. Add details about stage, dates, or outcome.`),
      actions:            [],
      needsClarification: true,
      isMock:             true,
    }
  }

  const summary = ctx.locale === 'he'
    ? `הנה ${actions.length} פעולות מוצעות עבור ${target.companyName}:`
    : `Here are ${actions.length} proposed updates for ${target.companyName}:`

  return {
    assistantMessage:   summary,
    actions,
    needsClarification: false,
    isMock:             true,
  }
}

function findApplicationInMessage(msg: string, apps: JobApplication[]): JobApplication | null {
  const norm = msg.toLowerCase()
  let best: JobApplication | null = null
  let bestLen = 0
  for (const app of apps) {
    const name = app.companyName.toLowerCase()
    if (name.length > 0 && norm.includes(name) && name.length > bestLen) {
      best = app
      bestLen = name.length
    }
  }
  return best
}

/** Return ISO datetime N days before the given today (09:00 local). */
function isoDaysAgo(todayIso: string, days: number): string {
  const d = new Date(todayIso)
  d.setDate(d.getDate() - days)
  d.setHours(9, 0, 0, 0)
  return d.toISOString()
}

/** Next given weekday (0=Sun ... 6=Sat) at given hour:minute, after today. */
function isoNextWeekday(todayIso: string, weekday: number, hour: number, minute: number): string {
  const d = new Date(todayIso)
  const diff = (weekday - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + diff)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}
