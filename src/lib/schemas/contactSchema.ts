import { z } from 'zod'

type TFn = (key: string) => string

export const makeContactSchema = (t: TFn) => z.object({
  name:          z.string().min(1, t('validation.required')).max(100),
  type:          z.enum(['HR', 'Recruiter', 'Hiring Manager', 'Employee', 'Referral', 'Other']),
  company:       z.string().max(100).optional(),
  title:         z.string().max(100).optional(),
  // Permissive email: anything with an @ and a dot (no whitespace) passes.
  // Strict RFC validation rejected legitimate addresses, so we relax here.
  email:         z.string()
                   .regex(/^\S+@\S+\.\S+$/, t('validation.invalidEmail'))
                   .max(200)
                   .optional()
                   .or(z.literal('')),
  phone:         z.string().max(40).optional(),
  linkedinUrl:   z.string().url(t('validation.invalidUrl')).optional().or(z.literal('')),
  notes:         z.string().max(2000).optional(),
  followUpDueAt: z.string().optional(),
})

export type ContactFormValues = z.infer<ReturnType<typeof makeContactSchema>>
