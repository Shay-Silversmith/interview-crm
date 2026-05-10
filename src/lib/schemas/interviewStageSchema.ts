import { z } from 'zod'

// t is not needed for this schema (no string messages currently), but we keep
// the factory signature consistent so forms can pass t uniformly.
export const makeInterviewStageSchema = (_t?: (key: string) => string) => z.object({
  type:             z.enum(['Phone Screen', 'HR Interview', 'Technical', 'System Design', 'Behavioral', 'Case Study', 'Home Assignment Review', 'Manager Interview', 'Final Round', 'Offer Call']),
  outcome:          z.enum(['Passed', 'Failed', 'Pending', 'Cancelled']),
  scheduledAt:      z.string().optional(),
  completedAt:      z.string().optional(),
  duration:         z.number().int().positive().optional(),
  interviewer:      z.string().max(100).optional(),
  interviewerTitle: z.string().max(100).optional(),
  notes:            z.string().max(2000).optional(),
  feedbackReceived: z.string().max(2000).optional(),
  nextSteps:        z.string().max(1000).optional(),
})

export type InterviewStageFormValues = z.infer<ReturnType<typeof makeInterviewStageSchema>>
