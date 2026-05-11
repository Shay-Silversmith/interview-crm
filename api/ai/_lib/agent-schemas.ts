// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/_lib/agent-schemas.ts
// Zod schemas for the conversational agent: request shape + the typed
// discriminated union of mutations Claude is allowed to propose.
// ---------------------------------------------------------------------------

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Enums (kept inline so the api/ tree stays isolated from src/)
// ---------------------------------------------------------------------------

const applicationStage = z.enum([
  'Interested', 'Applied', 'HR Screen', 'Home Assignment',
  'Technical Interview', 'Manager Interview', 'Final Interview',
  'Offer', 'Negotiating', 'Rejected', 'Accepted', 'Withdrawn',
])

const interviewType = z.enum([
  'Phone Screen', 'HR Interview', 'Technical', 'System Design',
  'Behavioral', 'Case Study', 'Home Assignment Review',
  'Manager Interview', 'Final Round', 'Offer Call',
])

const interviewOutcome = z.enum(['Passed', 'Failed', 'Pending', 'Cancelled'])
const taskCategory    = z.enum(['Preparation', 'Follow-up', 'Application', 'Assignment', 'Research', 'Admin'])
const taskPriority    = z.enum(['Low', 'Medium', 'High', 'Critical'])
const calendarEventType = z.enum([
  'Interview', 'Assignment Deadline', 'Application Deadline',
  'Follow-up Reminder', 'Preparation Session', 'General Task',
])

// ISO 8601 datetime string. Claude must always return absolute dates.
const isoDate = z.string().min(10).max(40)

// ---------------------------------------------------------------------------
// Action union — every kind Claude can propose
// ---------------------------------------------------------------------------

export const actionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind:          z.literal('update_application'),
    applicationId: z.string(),
    stage:         applicationStage.optional(),
    notes:         z.string().max(2000).optional(),
    nextEventAt:   isoDate.optional(),
    nextEventDescription: z.string().max(200).optional(),
  }),

  z.object({
    kind:          z.literal('create_interview_stage'),
    applicationId: z.string(),
    type:          interviewType,
    scheduledAt:   isoDate.optional(),
    completedAt:   isoDate.optional(),
    outcome:       interviewOutcome.optional(),
    notes:         z.string().max(1000).optional(),
  }),

  z.object({
    kind:    z.literal('update_interview_stage'),
    stageId: z.string(),
    outcome: interviewOutcome.optional(),
    completedAt: isoDate.optional(),
    scheduledAt: isoDate.optional(),
    notes:   z.string().max(1000).optional(),
  }),

  z.object({
    kind:          z.literal('create_task'),
    title:         z.string().min(1).max(200),
    description:   z.string().max(1000).optional(),
    category:      taskCategory.default('Preparation'),
    priority:      taskPriority.default('Medium'),
    dueAt:         isoDate.optional(),
    applicationId: z.string().optional(),
  }),

  z.object({
    kind:          z.literal('create_calendar_event'),
    title:         z.string().min(1).max(200),
    type:          calendarEventType,
    startAt:       isoDate,
    endAt:         isoDate.optional(),
    location:      z.string().max(200).optional(),
    description:   z.string().max(1000).optional(),
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
  }),
})

export type AgentRequest = z.infer<typeof agentRequestSchema>

export const agentResponseSchema = z.object({
  assistantMessage: z.string(),
  actions:          z.array(actionSchema).default([]),
  needsClarification: z.boolean().default(false),
})

export type AgentResponse = z.infer<typeof agentResponseSchema>
