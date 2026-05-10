import { z } from 'zod'

type TFn = (key: string) => string

export const makeCVVersionSchema = (t: TFn) => z.object({
  name:                z.string().min(1, t('validation.required')).max(100),
  version:             z.number().int().positive(),
  emphasis:            z.string().max(200).optional(),
  skillsHighlighted:   z.string().optional(),
  projectsHighlighted: z.string().optional(),
  notes:               z.string().max(1000).optional(),
  isActive:            z.boolean(),
})

export type CVVersionFormValues = z.infer<ReturnType<typeof makeCVVersionSchema>>
