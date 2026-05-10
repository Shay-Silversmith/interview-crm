import { z } from 'zod'

type TFn = (key: string) => string

export const makeCompanySchema = (t: TFn) => z.object({
  name:            z.string().min(1, t('validation.required')).max(100),
  industry:        z.string().max(100).optional(),
  size:            z.enum(['1-10', '11-50', '51-200', '201-500', '501-2000', '2001-10000', '10000+']).optional(),
  location:        z.string().max(100).optional(),
  website:         z.string().url(t('validation.invalidUrl')).optional().or(z.literal('')),
  linkedinUrl:     z.string().url(t('validation.invalidUrl')).optional().or(z.literal('')),
  // Empty string treated as "not set" so the field is always clearable.
  logoUrl:         z.string().url(t('validation.invalidUrl')).optional().or(z.literal('')),
  description:     z.string().max(2000).optional(),
  notes:           z.string().max(2000).optional(),
  glassdoorRating: z.number().min(0).max(5).optional(),
  techStack:       z.string().optional(),
})

export type CompanyFormValues = z.infer<ReturnType<typeof makeCompanySchema>>
