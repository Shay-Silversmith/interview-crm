import { z } from 'zod'

type TFn = (key: string) => string

export const makeCalendarEventSchema = (t: TFn) => z.object({
  title:           z.string().min(1, t('validation.required')).max(200),
  type:            z.enum(['Interview', 'Assignment Deadline', 'Application Deadline', 'Follow-up Reminder', 'Preparation Session', 'General Task']),
  startAt:         z.string().min(1, t('validation.required')),
  endAt:           z.string().optional(),
  allDay:          z.boolean().optional(),
  applicationId:   z.string().optional(),
  description:     z.string().max(1000).optional(),
  location:        z.string().max(200).optional(),
  meetingUrl:      z.string().url(t('validation.invalidUrl')).optional().or(z.literal('')),
  reminderMinutes: z.number().int().min(0).optional(),
})

export type CalendarEventFormValues = z.infer<ReturnType<typeof makeCalendarEventSchema>>
