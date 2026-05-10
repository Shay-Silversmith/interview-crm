import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { JobApplication, Company } from '@/types'
import { makeApplicationSchema, type ApplicationFormValues } from '@/lib/schemas/applicationSchema'
import { TextField, SelectField, TextareaField } from './Field'
import { FormRow, FormSection, SubmitBar } from './FormLayout'
import { useI18n } from '@/hooks/useI18n'

interface ApplicationFormProps {
  initial?: Partial<JobApplication>
  companies?: Company[]
  onSubmit: (values: ApplicationFormValues) => Promise<void> | void
  onCancel?: () => void
  loading?: boolean
  submitLabel?: string
}

export function ApplicationForm({ initial, companies = [], onSubmit, onCancel, loading, submitLabel }: ApplicationFormProps) {
  const { t } = useI18n()

  const schema = useMemo(() => makeApplicationSchema(t), [t])

  const STAGE_OPTS = [
    { value: 'Interested',          label: t('badges.stage.interested') },
    { value: 'Applied',             label: t('badges.stage.applied') },
    { value: 'HR Screen',           label: t('badges.stage.hrScreen') },
    { value: 'Home Assignment',     label: t('badges.stage.homeAssignment') },
    { value: 'Technical Interview', label: t('badges.stage.technicalInterview') },
    { value: 'Manager Interview',   label: t('badges.stage.managerInterview') },
    { value: 'Final Interview',     label: t('badges.stage.finalInterview') },
    { value: 'Offer',               label: t('badges.stage.offer') },
    { value: 'Negotiating',         label: t('badges.stage.negotiating') },
    { value: 'Accepted',            label: t('badges.stage.accepted') },
    { value: 'Rejected',            label: t('badges.stage.rejected') },
    { value: 'Withdrawn',           label: t('badges.stage.withdrawn') },
  ]
  const PRIORITY_OPTS = [
    { value: 'Critical', label: t('forms.options.priorityCritical') },
    { value: 'High',     label: t('forms.options.priorityHigh') },
    { value: 'Medium',   label: t('forms.options.priorityMedium') },
    { value: 'Low',      label: t('forms.options.priorityLow') },
  ]
  const WORK_MODEL_OPTS = [
    { value: '',         label: t('forms.options.notSpecified') },
    { value: 'Remote',   label: t('forms.options.workRemote') },
    { value: 'Hybrid',   label: t('forms.options.workHybrid') },
    { value: 'On-site',  label: t('forms.options.workOnSite') },
  ]
  const CURRENCY_OPTS = [
    { value: 'ILS', label: '₪ ILS' },
    { value: 'USD', label: '$ USD' },
    { value: 'EUR', label: '€ EUR' },
    { value: 'GBP', label: '£ GBP' },
  ]

  const { register, handleSubmit, formState: { errors } } = useForm<ApplicationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyId:       initial?.companyId    ?? '',
      companyName:     initial?.companyName  ?? '',
      roleName:        initial?.roleName     ?? '',
      roleUrl:         initial?.roleUrl      ?? '',
      stage:           initial?.stage        ?? 'Interested',
      priority:        initial?.priority     ?? 'Medium',
      workModel:       initial?.workModel,
      location:        initial?.location     ?? '',
      salaryMin:       initial?.salaryMin,
      salaryMax:       initial?.salaryMax,
      currency:        initial?.currency     ?? 'ILS',
      appliedAt:       initial?.appliedAt    ? initial.appliedAt.slice(0, 10) : '',
      deadlineAt:      initial?.deadlineAt   ? initial.deadlineAt.slice(0, 10) : '',
      jobDescription:  initial?.jobDescription  ?? '',
      notes:           initial?.notes           ?? '',
      whyInteresting:  initial?.whyInteresting  ?? '',
      whatToEmphasize: initial?.whatToEmphasize ?? '',
    },
  })

  const companyOpts = [
    { value: '', label: t('forms.options.selectCompany') },
    ...companies.map(c => ({ value: c.id, label: c.name })),
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <FormSection title={t('forms.sections.role')}>
        <SelectField
          label={t('forms.fields.company')} required
          options={companyOpts}
          error={errors.companyId?.message}
          {...register('companyId')}
        />
        <FormRow>
          <TextField label={t('forms.fields.roleName')} required placeholder="Senior Product Manager" error={errors.roleName?.message} {...register('roleName')} />
          <TextField label={t('forms.fields.jobPostingUrl')} type="url" placeholder="https://amazon.jobs/…" error={errors.roleUrl?.message} {...register('roleUrl')} />
        </FormRow>
        <FormRow>
          <SelectField label={t('forms.fields.stage')}    required options={STAGE_OPTS}    error={errors.stage?.message}    {...register('stage')} />
          <SelectField label={t('forms.fields.priority')} required options={PRIORITY_OPTS} error={errors.priority?.message} {...register('priority')} />
        </FormRow>
      </FormSection>

      <FormSection title={t('forms.sections.details')}>
        <FormRow>
          <SelectField label={t('forms.fields.workModel')} options={WORK_MODEL_OPTS} error={errors.workModel?.message} {...register('workModel')} />
          <TextField   label={t('forms.fields.location')}  placeholder="Tel Aviv · Remote-first" error={errors.location?.message} {...register('location')} />
        </FormRow>
        <FormRow cols={3}>
          <TextField label={t('forms.fields.minSalary')} type="number" placeholder="18000" error={errors.salaryMin?.message}
            {...register('salaryMin', { setValueAs: v => v === '' ? undefined : Number(v) })} />
          <TextField label={t('forms.fields.maxSalary')} type="number" placeholder="25000" error={errors.salaryMax?.message}
            {...register('salaryMax', { setValueAs: v => v === '' ? undefined : Number(v) })} />
          <SelectField label={t('forms.fields.currency')} options={CURRENCY_OPTS} error={errors.currency?.message} {...register('currency')} />
        </FormRow>
        <FormRow>
          <TextField label={t('forms.fields.appliedDate')} type="date" error={errors.appliedAt?.message}  {...register('appliedAt')} />
          <TextField label={t('forms.fields.deadline')}    type="date" error={errors.deadlineAt?.message} {...register('deadlineAt')} />
        </FormRow>
      </FormSection>

      <FormSection title={t('forms.sections.strategy')}>
        <TextareaField label={t('forms.fields.whyInteresting')}  placeholder="What excites me about this role and company…" rows={3} error={errors.whyInteresting?.message}  {...register('whyInteresting')} />
        <TextareaField label={t('forms.fields.whatToEmphasize')} placeholder="Key experiences and skills to highlight in interviews…" rows={3} error={errors.whatToEmphasize?.message} {...register('whatToEmphasize')} />
      </FormSection>

      <FormSection title={t('forms.sections.jobDescription')}>
        <TextareaField label={t('forms.fields.jobDescription')} placeholder="Paste the full JD here…" rows={8} className="min-h-[160px]" error={errors.jobDescription?.message} {...register('jobDescription')} />
      </FormSection>

      <FormSection title={t('forms.sections.privateNotes')}>
        <TextareaField label={t('forms.fields.notes')} placeholder="Referral contact, insider tips, salary benchmarks…" rows={4} error={errors.notes?.message} {...register('notes')} />
      </FormSection>

      <SubmitBar
        submitLabel={submitLabel ?? (initial?.id ? t('forms.actions.save') : t('forms.actions.addApplication'))}
        onCancel={onCancel}
        loading={loading}
      />
    </form>
  )
}
