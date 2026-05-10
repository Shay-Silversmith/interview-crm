import { z } from 'zod'

type TFn = (key: string) => string

export const makeTaskSchema = (t: TFn) => z.object({
  title:         z.string().min(1, t('validation.required')).max(200),
  description:   z.string().max(1000).optional(),
  category:      z.enum(['Preparation', 'Follow-up', 'Application', 'Assignment', 'Research', 'Admin']),
  priority:      z.enum(['Critical', 'High', 'Medium', 'Low']),
  status:        z.enum(['Todo', 'In Progress', 'Done', 'Cancelled']),
  dueAt:         z.string().optional(),
  applicationId: z.string().optional(),
  companyName:   z.string().optional(),
})

export type TaskFormValues = z.infer<ReturnType<typeof makeTaskSchema>>
