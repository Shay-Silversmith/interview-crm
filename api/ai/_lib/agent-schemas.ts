// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/_lib/agent-schemas.ts
// Zod schemas for the conversational agent: request shape + the typed
// discriminated union of mutations Claude is allowed to propose.
// ---------------------------------------------------------------------------

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Enums (kept inline so the api/ tree stays isolated from src/)
// ---------------------------------------------------------------------------

/**
 * An enum that reads what the model meant rather than rejecting what it wrote.
 *
 * The model is told the allowed values and mostly uses them, but a real hiring
 * process has steps the list does not name — an assessment day, a take-home
 * test, a "professional interview" — and it reaches for the natural label.
 * One such label used to fail validation for the whole plan, so a message
 * describing five rounds produced nothing because of the name of one. Every
 * proposed action is shown to the user before it runs, so a near miss mapped
 * to the closest value and corrected by eye is far better than no plan.
 *
 * Order: exact match ignoring case, then the first keyword rule that fits,
 * then the fallback.
 */
function lenientEnum<const T extends readonly [string, ...string[]]>(
  values:   T,
  rules:    Array<[RegExp, T[number]]>,
  fallback: T[number],
) {
  return z.preprocess(raw => {
    if (typeof raw !== 'string') return raw
    const text  = raw.trim()
    const exact = values.find(v => v.toLowerCase() === text.toLowerCase())
    if (exact) return exact
    for (const [pattern, value] of rules) if (pattern.test(text)) return value
    return fallback
  }, z.enum(values))
}

const applicationStage = lenientEnum(
  [
    'Interested', 'Applied', 'HR Screen', 'Home Assignment',
    'Technical Interview', 'Manager Interview', 'Final Interview',
    'Offer', 'Negotiating', 'Rejected', 'Accepted', 'Withdrawn',
  ],
  [
    [/negotiat/i,                               'Negotiating'],
    [/offer/i,                                  'Offer'],
    [/reject|declin/i,                          'Rejected'],
    [/accept|hired|signed/i,                    'Accepted'],
    [/withdr/i,                                 'Withdrawn'],
    [/final|last round/i,                       'Final Interview'],
    [/manager|hiring/i,                         'Manager Interview'],
    [/assign|take.?home|assess|test|exam|task/i,'Home Assignment'],
    [/tech|profession|system|coding|case/i,     'Technical Interview'],
    [/hr|phone|screen|recruit/i,                'HR Screen'],
    [/interview|round/i,                        'Technical Interview'],
    [/interest|saved|wishlist/i,                'Interested'],
  ],
  'Applied',
)

const interviewType = lenientEnum(
  [
    'Phone Screen', 'HR Interview', 'Technical', 'System Design',
    'Behavioral', 'Case Study', 'Home Assignment Review',
    'Manager Interview', 'Final Round', 'Offer Call',
  ],
  [
    [/offer/i,                                        'Offer Call'],
    [/final|last round|second|follow.?up|repeat/i,    'Final Round'],
    [/manager|hiring|director|vp|ceo|cto/i,           'Manager Interview'],
    [/assign|take.?home|assess|test|exam|presentation|task/i, 'Home Assignment Review'],
    [/system/i,                                       'System Design'],
    [/case/i,                                         'Case Study'],
    [/behavio|personal|culture|fit|values/i,          'Behavioral'],
    [/hr|recruit|people/i,                            'HR Interview'],
    [/phone|screen|intro/i,                           'Phone Screen'],
  ],
  'Technical',
)

const interviewOutcome = lenientEnum(
  ['Passed', 'Failed', 'Pending', 'Cancelled'],
  [
    [/pass|success|advanc|positive|good/i, 'Passed'],
    [/fail|reject|negative/i,              'Failed'],
    [/cancel/i,                            'Cancelled'],
  ],
  'Pending',
)

const taskCategory = lenientEnum(
  ['Preparation', 'Follow-up', 'Application', 'Assignment', 'Research', 'Admin'],
  [
    [/follow/i,             'Follow-up'],
    [/assign|task|home/i,   'Assignment'],
    [/research|read|learn/i,'Research'],
    [/appl/i,               'Application'],
    [/admin|paper|doc/i,    'Admin'],
  ],
  'Preparation',
)

const taskPriority = lenientEnum(
  ['Low', 'Medium', 'High', 'Critical'],
  [[/crit|urgent|asap/i, 'Critical'], [/high|important/i, 'High'], [/low|minor/i, 'Low']],
  'Medium',
)

const calendarEventType = lenientEnum(
  [
    'Interview', 'Assignment Deadline', 'Application Deadline',
    'Follow-up Reminder', 'Preparation Session', 'General Task',
  ],
  [
    [/interview|round|call|meeting/i, 'Interview'],
    [/assign|home|test/i,             'Assignment Deadline'],
    [/appl|deadline/i,                'Application Deadline'],
    [/follow|remind/i,                'Follow-up Reminder'],
    [/prep|study|practice/i,          'Preparation Session'],
  ],
  'General Task',
)

/**
 * Free text from the model, cut to length rather than refused.
 *
 * Same reasoning as lenientEnum: a note that runs ten characters over is not a
 * reason to throw away a five-step plan.
 */
const clipped = (max: number) => z.string().transform(v => v.trim().slice(0, max))

// ISO 8601 datetime string. Claude must always return absolute dates.
const isoDate = z.string().min(10).max(40)

// ---------------------------------------------------------------------------
// Action union — every kind Claude can propose
// ---------------------------------------------------------------------------

export const actionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind:        z.literal('create_application'),
    /** Handle later actions in the same plan use as applicationId, e.g. "new-1". */
    ref:         clipped(40).pipe(z.string().min(1)),
    /** Copied from the companies list when the company already exists. */
    companyId:   z.string().optional(),
    companyName: clipped(200).pipe(z.string().min(1)),
    roleName:    clipped(200).pipe(z.string().min(1)),
    stage:       applicationStage.default('Applied'),
    roleUrl:     clipped(2000).optional(),
    notes:       clipped(2000).optional(),
    appliedAt:   isoDate.optional(),
  }),

  z.object({
    kind:          z.literal('update_application'),
    applicationId: z.string(),
    stage:         applicationStage.optional(),
    notes:         clipped(2000).optional(),
    nextEventAt:   isoDate.optional(),
    nextEventDescription: clipped(200).optional(),
  }),

  z.object({
    kind:          z.literal('create_interview_stage'),
    applicationId: z.string(),
    type:          interviewType,
    scheduledAt:   isoDate.optional(),
    completedAt:   isoDate.optional(),
    outcome:       interviewOutcome.optional(),
    notes:         clipped(1000).optional(),
  }),

  z.object({
    kind:    z.literal('update_interview_stage'),
    stageId: z.string(),
    outcome: interviewOutcome.optional(),
    completedAt: isoDate.optional(),
    scheduledAt: isoDate.optional(),
    notes:   clipped(1000).optional(),
  }),

  z.object({
    kind:          z.literal('create_task'),
    title:         clipped(200).pipe(z.string().min(1)),
    description:   clipped(1000).optional(),
    category:      taskCategory.default('Preparation'),
    priority:      taskPriority.default('Medium'),
    dueAt:         isoDate.optional(),
    applicationId: z.string().optional(),
  }),

  z.object({
    kind:          z.literal('create_calendar_event'),
    title:         clipped(200).pipe(z.string().min(1)),
    type:          calendarEventType,
    startAt:       isoDate,
    endAt:         isoDate.optional(),
    location:      clipped(200).optional(),
    description:   clipped(1000).optional(),
    applicationId: z.string().optional(),
  }),
])

export type AgentAction = z.infer<typeof actionSchema>

// ---------------------------------------------------------------------------
// Request / response schemas for /api/ai/agent
// ---------------------------------------------------------------------------

const messageSchema = z.object({
  role:    z.enum(['user', 'assistant']),
  content: z.string().max(8000),
})

const contextStageSchema = z.object({
  id:          z.string(),
  type:        z.string(),
  outcome:     z.string().optional(),
  scheduledAt: z.string().optional(),
  completedAt: z.string().optional(),
})

const contextCompanySchema = z.object({
  id:   z.string(),
  name: z.string(),
})

const contextApplicationSchema = z.object({
  id:           z.string(),
  companyName:  z.string(),
  roleName:     z.string(),
  stage:        z.string(),
  interviewStages: z.array(contextStageSchema).default([]),
})

export const agentRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  history: z.array(messageSchema).max(20).default([]),
  context: z.object({
    today:        z.string(),                // ISO date — anchors relative phrases like "Sunday"
    timezone:     z.string().default('Asia/Jerusalem'),
    locale:       z.enum(['en', 'he']).default('en'),
    applications: z.array(contextApplicationSchema).max(100).default([]),
    // A company can be in the CRM with no application yet. Without this list
    // the agent could not see it, and asked "which company?" about one the
    // user had just named.
    companies:    z.array(contextCompanySchema).max(500).default([]),
  }),
})

export type AgentRequest = z.infer<typeof agentRequestSchema>

export const agentResponseSchema = z.object({
  assistantMessage: z.string(),
  // "notes": null is how a model says "no notes", and optional() refuses null.
  // Drop null keys before validating so absence in either spelling is absence.
  actions:          z.preprocess(
    raw => Array.isArray(raw)
      ? raw.map(a => a && typeof a === 'object'
          ? Object.fromEntries(Object.entries(a).filter(([, v]) => v !== null))
          : a)
      : raw,
    z.array(actionSchema),
  ).default([]),
  needsClarification: z.boolean().default(false),
})

export type AgentResponse = z.infer<typeof agentResponseSchema>
