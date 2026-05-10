// ---------------------------------------------------------------------------
// CalendarEventForm — modal form for create / edit calendar events
// ---------------------------------------------------------------------------
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { CalendarEvent, JobApplication } from '@/types'
import { makeCalendarEventSchema, type CalendarEventFormValues } from '@/lib/schemas/calendarEventSchema'
import { TextField, SelectField, TextareaField, CheckboxField } from './Field'
import { FormRow, SubmitBar } from './FormLayout'
import { useI18n } from '@/hooks/useI18n'

interface CalendarEventFormProps {
  initial?: Partial<CalendarEvent>
  applications?: JobApplication[]
  onSubmit: (values: CalendarEventFormValues) => Promise<void> | void
  onCancel: () => void
  loading?: boolean
}

export function CalendarEventForm({ initial, applications = [], onSubmit, onCancel, loading }: CalendarEventFormProps) {
  const { t } = useI18n()

  const schema = useMemo(() => makeCalendarEventSchema(t), [t])

  const TYPE_OPTS = [
    { value: 'Interview',            label: t('forms.options.evtInterview') },
    { value: 'Assignment Deadline',  label: t('forms.options.evtAssignmentDeadline') },
    { value: 'Application Deadline', label: t('forms.options.evtApplicationDeadline') },
    { value: 'Follow-up Reminder',   label: t('forms.options.evtFollowUpReminder') },
    { value: 'Preparation Session',  label: t('forms.options.evtPreparationSession') },
    { value: 'General Task',         label: t('forms.options.evtGeneralTask') },
  ]

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CalendarEventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:           initial?.title ?? '',
      type:            initial?.type ?? 'Interview',
      startAt:         initial?.startAt ? initial.startAt.slice(0, 16) : '',
      endAt:           initial?.endAt   ? initial.endAt.slice(0, 16)   : '',
      allDay:          initial?.allDay  ?? false,
      applicationId:   initial?.applicationId ?? '',
      description:     initial?.description ?? '',
      location:        initial?.location ?? '',
      meetingUrl:      initial?.meetingUrl ?? '',
      reminderMinutes: initial?.reminderMinutes,
    },
  })

  const allDay = watch('allDay')
  const appOpts = [
    { value: '', label: t('forms.options.none') },
    ...applications.map(a => ({ value: a.id, label: `${a.roleName} @ ${a.companyName}` })),
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <TextField    label={t('forms.fields.title')} required placeholder="Technical interview — Amazon" error={errors.title?.message} {...register('title')} />
      <SelectField  label={t('forms.fields.type')}  required options={TYPE_OPTS} error={errors.type?.message} {...register('type')} />

      <CheckboxField
        label={t('forms.fields.allDay')}
        checked={allDay}
        onChange={v => setValue('allDay', v)}
      />

      <FormRow>
        <TextField label={t('forms.fields.startAt')} required type={allDay ? 'date' : 'datetime-local'} error={errors.startAt?.message} {...register('startAt')} />
        <TextField label={t('forms.fields.endAt')}           type={allDay ? 'date' : 'datetime-local'} error={errors.endAt?.message}   {...register('endAt')} />
      </FormRow>

      {applications.length > 0 && (
        <SelectField label={t('forms.fields.linkedApplication')} options={appOpts} error={errors.applicationId?.message} {...register('applicationId')} />
      )}

      <TextField label={t('forms.fields.locationPlatform')} placeholder="Zoom · office address…" error={errors.location?.message}    {...register('location')} />
      <TextField label={t('forms.fields.meetingUrl')}        type="url" placeholder="https://zoom.us/j/…"   error={errors.meetingUrl?.message} {...register('meetingUrl')} />
      <TextField
        label={t('forms.fields.reminderMinutes')}
        type="number" placeholder="15"
        error={errors.reminderMinutes?.message}
        {...register('reminderMinutes', { setValueAs: v => v === '' ? undefined : Number(v) })}
      />
      <TextareaField label={t('forms.fields.description')} placeholder="Context or preparation notes…" rows={3} error={errors.description?.message} {...register('description')} />

      <SubmitBar
        submitLabel={initial?.id ? t('forms.actions.save') : t('forms.actions.addEvent')}
        onCancel={onCancel}
        loading={loading}
      />
    </form>
  )
}
