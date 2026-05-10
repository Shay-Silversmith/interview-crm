import { z } from 'zod'

type TFn = (key: string) => string

export const makeContactSchema = (t: TFn) => z.object({
  name:          z.string().min(1, t('validation.required')).max(100),
  type:          z.enum(['HR', 'Recruiter', 'Hiring Manager', 'Employee', 'Referral', 'Other']),
  company:       z.string().max(100).optional(),
  title:         z.string().max(100).optional(),
  email:         z.string().email(t('validation.invalidEmail')).optional().or(z.literal('')),
  linkedinUrl:   z.string().url(t('validation.invalidUrl')).optional().or(z.literal('')),
  notes:         z.string().max(2000).optional(),
  followUpDueAt: z.string().optional(),
})

export type ContactFormValues = z.infer<ReturnType<typeof makeContactSchema>>
