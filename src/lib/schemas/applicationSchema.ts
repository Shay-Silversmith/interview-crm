import { z } from 'zod'

type TFn = (key: string) => string

export const makeApplicationSchema = (t: TFn) => z.object({
  companyId:        z.string().min(1, t('validation.required')),
  companyName:      z.string().min(1, t('validation.required')),
  roleName:         z.string().min(1, t('validation.required')).max(150),
  roleUrl:          z.string().url(t('validation.invalidUrl')).optional().or(z.literal('')),
  stage:            z.enum(['Interested', 'Applied', 'HR Screen', 'Home Assignment', 'Technical Interview', 'Manager Interview', 'Final Interview', 'Offer', 'Negotiating', 'Rejected', 'Withdrawn', 'Accepted']),
  priority:         z.enum(['Critical', 'High', 'Medium', 'Low']),
  workModel:        z.enum(['Remote', 'Hybrid', 'On-site']).optional(),
  location:         z.string().max(100).optional(),
  salaryMin:        z.number().positive(t('validation.positiveNumber')).optional(),
  salaryMax:        z.number().positive(t('validation.positiveNumber')).optional(),
  currency:         z.string().max(10).optional(),
  appliedAt:        z.string().optional(),
  deadlineAt:       z.string().optional(),
  jobDescription:   z.string().optional(),
  notes:            z.string().max(3000).optional(),
  whyInteresting:   z.string().max(1000).optional(),
  whatToEmphasize:  z.string().max(1000).optional(),
})

export type ApplicationFormValues = z.infer<ReturnType<typeof makeApplicationSchema>>

// ---------------------------------------------------------------------------
// Edit schema — used in EditApplicationDrawer.
// Does NOT require companyId / stage / priority (set via inline hero chips).
// ---------------------------------------------------------------------------
export const makeApplicationEditSchema = (t: TFn) => z.object({
  roleName:      z.string().min(1, t('validation.required')).max(150),
  roleUrl:       z.string().url(t('validation.invalidUrl')).optional().or(z.literal('')),
  location:      z.string().max(100).optional(),
  workModel:     z.enum(['Remote', 'Hybrid', 'On-site']).optional(),
  salaryMin:     z.number().positive(t('validation.positiveNumber')).optional(),
  salaryMax:     z.number().positive(t('validation.positiveNumber')).optional(),
  currency:      z.string().max(10).optional(),
  submittedCvId: z.string().optional(),
  notes:         z.string().max(3000).optional(),
})

export type ApplicationEditFormValues = z.infer<ReturnType<typeof makeApplicationEditSchema>>
