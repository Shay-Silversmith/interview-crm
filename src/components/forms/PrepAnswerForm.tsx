// ---------------------------------------------------------------------------
// PrepAnswerForm — drawer form for create / edit interview prep answers
// ---------------------------------------------------------------------------
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { PreparedAnswer } from '@/types'
import { makePrepAnswerSchema, type PrepAnswerFormValues } from '@/lib/schemas/prepAnswerSchema'
import { TextField, SelectField, TextareaField, CheckboxField } from './Field'
import { FormRow, SubmitBar } from './FormLayout'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/cn'

interface PrepAnswerFormProps {
  initial?: Partial<PreparedAnswer>
  onSubmit: (values: PrepAnswerFormValues) => Promise<void> | void
  onCancel: () => void
  loading?: boolean
}

export function PrepAnswerForm({ initial, onSubmit, onCancel, loading }: PrepAnswerFormProps) {
  const { t } = useI18n()

  const schema = useMemo(() => makePrepAnswerSchema(t), [t])

  const CATEGORY_OPTS = [
    { value: 'Personal Pitch',      label: t('forms.options.prepPersonalPitch') },
    { value: 'HR',                  label: t('forms.options.prepHR') },
    { value: 'Behavioral',          label: t('forms.options.prepBehavioral') },
    { value: 'STAR',                label: t('forms.options.prepSTAR') },
    { value: 'Technical',           label: t('forms.options.prepTechnical') },
    { value: 'Product / PM',        label: t('forms.options.prepProductPM') },
    { value: 'SQL',                 label: t('forms.options.prepSQL') },
    { value: 'Python',              label: t('forms.options.prepPython') },
    { value: 'Data Engineering',    label: t('forms.options.prepDataEngineering') },
    { value: 'Information Systems', label: t('forms.options.prepInfoSystems') },
  ]

  const CONFIDENCE_LABELS: Record<number, string> = {
    1: t('forms.options.confidence1'),
    2: t('forms.options.confidence2'),
    3: t('forms.options.confidence3'),
    4: t('forms.options.confidence4'),
    5: t('forms.options.confidence5'),
  }

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PrepAnswerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      question:   initial?.question ?? '',
      category:   initial?.category ?? 'Behavioral',
      answer:     initial?.answer ?? '',
      confidence: initial?.confidence ?? 3,
      isReady:    initial?.isReady ?? false,
      tags:       initial?.tags?.join(', ') ?? '',
    },
  })

  const confidence = watch('confidence')
  const isReady    = watch('isReady')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <TextareaField
        label={t('forms.fields.question')} required
        placeholder="Tell me about yourself…"
        rows={3}
        error={errors.question?.message}
        {...register('question')}
      />
      <SelectField label={t('forms.fields.category')} required options={CATEGORY_OPTS} error={errors.category?.message} {...register('category')} />

      <TextareaField
        label={t('forms.fields.answer')}
        placeholder="Write your prepared response here. Use the STAR framework where applicable: Situation, Task, Action, Result."
        rows={8}
        className="min-h-[160px]"
        error={errors.answer?.message}
        {...register('answer')}
      />

      {/* Confidence slider */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">
          {t('forms.fields.confidence')} — <span className="font-semibold text-slate-800">{CONFIDENCE_LABELS[confidence ?? 3]}</span>
        </label>
        <div className="flex gap-2">
          {([1, 2, 3, 4, 5] as const).map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setValue('confidence', n)}
              className={cn(
                'flex-1 h-8 rounded-lg text-sm font-medium border transition-colors',
                confidence === n
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-surface text-slate-500 border-slate-200 hover:border-primary-300'
              )}
            >
              {n}
            </button>
          ))}
        </div>
        {errors.confidence && <p className="text-xs text-danger-600">{errors.confidence.message}</p>}
      </div>

      <CheckboxField
        label={t('forms.fields.markAsReady')}
        description={t('forms.fields.markAsReadyDesc')}
        checked={isReady}
        onChange={v => setValue('isReady', v)}
      />

      <TextField
        label={t('forms.fields.tags')}
        placeholder="leadership, amazon, LP1"
        hint={t('forms.hints.commaSeparated')}
        error={errors.tags?.message}
        {...register('tags')}
      />

      <SubmitBar
        submitLabel={initial?.id ? t('forms.actions.save') : t('forms.actions.addAnswer')}
        onCancel={onCancel}
        loading={loading}
      />
    </form>
  )
}
