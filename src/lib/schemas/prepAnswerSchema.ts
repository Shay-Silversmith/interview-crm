import { z } from 'zod'

type TFn = (key: string) => string

export const makePrepAnswerSchema = (t: TFn) => z.object({
  question:   z.string().min(1, t('validation.required')).max(500),
  category:   z.enum(['Personal Pitch', 'HR', 'Behavioral', 'STAR', 'Technical', 'Product / PM', 'SQL', 'Python', 'Data Engineering', 'Information Systems']),
  answer:     z.string().max(5000).optional(),
  confidence: z.number().int().min(1).max(5),
  isReady:    z.boolean(),
  tags:       z.string().optional(),
})

export type PrepAnswerFormValues = z.infer<ReturnType<typeof makePrepAnswerSchema>>
