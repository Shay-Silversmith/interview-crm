// ---------------------------------------------------------------------------
// InterviewStageForm — modal form for adding / editing interview rounds
// ---------------------------------------------------------------------------
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { InterviewStage } from '@/types'
import { makeInterviewStageSchema, type InterviewStageFormValues } from '@/lib/schemas/interviewStageSchema'
import { TextField, SelectField, TextareaField } from './Field'
import { FormRow, FormSection, SubmitBar } from './FormLayout'
import { useI18n } from '@/hooks/useI18n'
import { toLocalInput } from '@/utils/format'

interface InterviewStageFormProps {
  initial?: Partial<InterviewStage>
  onSubmit: (values: InterviewStageFormValues) => Promise<void> | void
  onCancel: () => void
  loading?: boolean
}

export function InterviewStageForm({ initial, onSubmit, onCancel, loading }: InterviewStageFormProps) {
  const { t } = useI18n()

  const schema = useMemo(() => makeInterviewStageSchema(t), [t])

  const TYPE_OPTS = [
    { value: 'Phone Screen',           label: t('forms.options.intPhoneScreen') },
    { value: 'HR Interview',           label: t('forms.options.intHrInterview') },
    { value: 'Technical',              label: t('forms.options.intTechnical') },
    { value: 'Technical Test',         label: t('forms.options.intTechnicalTest') },
    { value: 'System Design',          label: t('forms.options.intSystemDesign') },
    { value: 'Behavioral',             label: t('forms.options.intBehavioral') },
    { value: 'Case Study',             label: t('forms.options.intCaseStudy') },
    { value: 'Home Assignment Review', label: t('forms.options.intHomeAssignmentReview') },
    { value: 'Manager Interview',      label: t('forms.options.intManagerInterview') },
    { value: 'Final Round',            label: t('forms.options.intFinalRound') },
    { value: 'Offer Call',             label: t('forms.options.intOfferCall') },
  ]
  const OUTCOME_OPTS = [
    { value: 'Pending',   label: t('forms.options.outcomePending') },
    { value: 'Passed',    label: t('forms.options.outcomePassed') },
    { value: 'Failed',    label: t('forms.options.outcomeFailed') },
    { value: 'Cancelled', label: t('forms.options.outcomeCancelled') },
  ]

  const { register, handleSubmit, formState: { errors } } = useForm<InterviewStageFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type:             initial?.type ?? 'Phone Screen',
      outcome:          initial?.outcome ?? 'Pending',
      // One date on screen. A round logged after the fact — by the assistant,
      // say — may carry only a completion time, so that is the fallback.
      scheduledAt:      toLocalInput(initial?.scheduledAt ?? initial?.completedAt),
      completedAt:      '',
      duration:         initial?.duration,
      interviewer:      initial?.interviewer ?? '',
      interviewerTitle: initial?.interviewerTitle ?? '',
      notes:            initial?.notes ?? '',
      feedbackReceived: initial?.feedbackReceived ?? '',
      nextSteps:        initial?.nextSteps ?? '',
    },
  })

  // "Scheduled for" and "completed at" were two fields asking the same
  // question: a round happens when it is scheduled. The record still keeps
  // both, because the timeline and the dashboard read completedAt to tell a
  // finished round from an upcoming one — so it is derived from the outcome
  // rather than typed a second time.
  const submit = (values: InterviewStageFormValues) => {
    const finished = values.outcome === 'Passed' || values.outcome === 'Failed'
    return onSubmit({ ...values, completedAt: finished ? values.scheduledAt : '' })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <FormRow>
        <SelectField label={t('forms.fields.roundType')} required options={TYPE_OPTS}    error={errors.type?.message}    {...register('type')} />
        <SelectField label={t('forms.fields.outcome')}   required options={OUTCOME_OPTS} error={errors.outcome?.message} {...register('outcome')} />
      </FormRow>

      <FormSection title={t('forms.sections.schedule')}>
        <FormRow>
          <TextField label={t('forms.fields.roundDate')} type="datetime-local" error={errors.scheduledAt?.message} {...register('scheduledAt')} />
          <TextField label={t('forms.fields.durationMinutes')} type="number" placeholder="60" error={errors.duration?.message}
            {...register('duration', { setValueAs: v => v === '' ? undefined : Number(v) })} />
        </FormRow>
      </FormSection>

      <FormSection title={t('forms.sections.interviewer')}>
        <FormRow>
          <TextField label={t('forms.fields.interviewerName')}  placeholder="Yael Shapiro"    error={errors.interviewer?.message}      {...register('interviewer')} />
          <TextField label={t('forms.fields.interviewerTitle')} placeholder="Engineering Lead" error={errors.interviewerTitle?.message} {...register('interviewerTitle')} />
        </FormRow>
      </FormSection>

      <TextareaField label={t('forms.fields.stageNotes')}      placeholder="What was discussed…"  rows={3} error={errors.notes?.message}            {...register('notes')} />
      <TextareaField label={t('forms.fields.feedbackReceived')} placeholder="What they said…"      rows={3} error={errors.feedbackReceived?.message}  {...register('feedbackReceived')} />
      <TextareaField label={t('forms.fields.nextSteps')}        placeholder="What happens next…"   rows={2} error={errors.nextSteps?.message}         {...register('nextSteps')} />

      <SubmitBar
        submitLabel={initial?.id ? t('forms.actions.save') : t('forms.actions.addRound')}
        onCancel={onCancel}
        loading={loading}
      />
    </form>
  )
}
