// ---------------------------------------------------------------------------
// CVVersionForm — drawer form for create / edit CV versions
// ---------------------------------------------------------------------------
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { CVVersion } from '@/types'
import type { ReactNode } from 'react'
import { makeCVVersionSchema, type CVVersionFormValues } from '@/lib/schemas/cvVersionSchema'
import { TextField, TextareaField, CheckboxField } from './Field'
import { FormRow, FormSection, SubmitBar } from './FormLayout'
import { useI18n } from '@/hooks/useI18n'

interface CVVersionFormProps {
  initial?: Partial<CVVersion>
  onSubmit: (values: CVVersionFormValues) => Promise<void> | void
  onCancel: () => void
  loading?: boolean
  /** Slot for file upload UI (e.g. FileDropzone). Replaces the Phase 9 placeholder. */
  fileSlot?: ReactNode
}

export function CVVersionForm({ initial, onSubmit, onCancel, loading, fileSlot }: CVVersionFormProps) {
  const { t } = useI18n()

  const schema = useMemo(() => makeCVVersionSchema(t), [t])

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CVVersionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:                initial?.name     ?? '',
      version:             initial?.version  ?? 1,
      emphasis:            initial?.emphasis ?? '',
      skillsHighlighted:   initial?.skillsHighlighted?.join(', ')   ?? '',
      projectsHighlighted: initial?.projectsHighlighted?.join(', ') ?? '',
      notes:               initial?.notes    ?? '',
      isActive:            initial?.isActive ?? true,
    },
  })

  const isActive = watch('isActive')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormSection title={t('forms.sections.identity')}>
        <FormRow>
          <TextField
            label={t('forms.fields.versionName')} required
            placeholder="PM-focused v2"
            hint={t('forms.hints.versionNameHint')}
            error={errors.name?.message}
            {...register('name')}
          />
          <TextField
            label={t('forms.fields.versionNumber')} required type="number" min={1}
            error={errors.version?.message}
            {...register('version', { setValueAs: v => Number(v) })}
          />
        </FormRow>
        <TextField
          label={t('forms.fields.emphasis')}
          placeholder="Data-heavy PM roles at scale-ups"
          hint={t('forms.hints.emphasisHint')}
          error={errors.emphasis?.message}
          {...register('emphasis')}
        />
      </FormSection>

      <FormSection title={t('forms.sections.contentHighlights')}>
        <TextField
          label={t('forms.fields.skillsHighlighted')}
          placeholder="SQL, Python, Tableau, dbt"
          hint={t('forms.hints.commaSeparated')}
          error={errors.skillsHighlighted?.message}
          {...register('skillsHighlighted')}
        />
        <TextField
          label={t('forms.fields.projectsHighlighted')}
          placeholder="Real-time Fraud Pipeline, MyHeritage Rec Engine"
          hint={t('forms.hints.commaSeparated')}
          error={errors.projectsHighlighted?.message}
          {...register('projectsHighlighted')}
        />
      </FormSection>

      {/* File upload slot */}
      {fileSlot}

      <TextareaField
        label={t('forms.fields.notes')} rows={3}
        placeholder="Tailored for ML / data roles, emphasises unit intelligence background…"
        error={errors.notes?.message}
        {...register('notes')}
      />

      <CheckboxField
        label={t('forms.fields.setActiveCV')}
        description={t('forms.fields.setActiveCVDesc')}
        checked={isActive}
        onChange={v => setValue('isActive', v)}
      />

      <SubmitBar
        submitLabel={initial?.id ? t('forms.actions.save') : t('forms.actions.addCvVersion')}
        onCancel={onCancel}
        loading={loading}
      />
    </form>
  )
}
