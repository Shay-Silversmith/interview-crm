import { z } from 'zod'

type TFn = (key: string) => string

export const makeDocumentSchema = (t: TFn) => z.object({
  name:  z.string().min(1, t('validation.required')).max(200),
  type:  z.enum(['CV', 'Cover Letter', 'Portfolio', 'Certificate', 'Transcript', 'Reference Letter', 'Other']),
  notes: z.string().max(1000).optional(),
})

export type DocumentFormValues = z.infer<ReturnType<typeof makeDocumentSchema>>
