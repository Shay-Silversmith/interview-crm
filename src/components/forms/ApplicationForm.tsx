import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, AlertTriangle, Sparkles } from 'lucide-react'
import type { JobApplication, Company } from '@/types'
import { makeApplicationSchema, emptyToUndef, type ApplicationFormValues } from '@/lib/schemas/applicationSchema'
import { TextField, SelectField, TextareaField } from './Field'
import { FormRow, FormSection, SubmitBar } from './FormLayout'
import { useI18n } from '@/hooks/useI18n'
import { useToastActions } from '@/hooks/useToast'
import { useCompanyMutations } from '@/hooks/useCompanyMutations'
import { aiService } from '@/services/aiService'
import { companiesService } from '@/services/companiesService'
import { JDSummarizeDialog } from '@/components/applications/JDSummarizeDialog'

interface ApplicationFormProps {
  initial?: Partial<JobApplication>
  companies?: Company[]
  onSubmit: (values: ApplicationFormValues) => Promise<void> | void
  onCancel?: () => void
  loading?: boolean
  submitLabel?: string
}

export function ApplicationForm({ initial, companies = [], onSubmit, onCancel, loading, submitLabel }: ApplicationFormProps) {
  const { t, locale } = useI18n()

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
  const JOB_SCOPE_OPTS = [
    { value: '',             label: t('forms.options.notSpecified') },
    { value: '2 days/week',  label: '2 days / week' },
    { value: '3 days/week',  label: '3 days / week' },
    { value: '4 days/week',  label: '4 days / week' },
    { value: 'Full-time',    label: 'Full-time' },
  ]
  const SALARY_TYPE_OPTS = [
    { value: 'Hourly',  label: 'Hourly (₪/hr)' },
    { value: 'Monthly', label: 'Monthly (gross)' },
  ]
  const CURRENCY_OPTS = [
    { value: 'ILS', label: '₪ ILS' },
    { value: 'USD', label: '$ USD' },
    { value: 'EUR', label: '€ EUR' },
    { value: 'GBP', label: '£ GBP' },
  ]

  const toast = useToastActions()
  const { create: createCompany, update: updateCompany } = useCompanyMutations()
  const [enriching, setEnriching] = useState(false)
  // The companies query refetches asynchronously, so a company created a
  // moment ago is not in `companies` yet. Without an <option> to match, the
  // browser resets the select to its placeholder and the selection is lost —
  // which is why the new company had to be hunted for in the list.
  const [justCreated, setJustCreated] = useState<Company | null>(null)
  const [filling, setFilling] = useState(false)
  const [notFound, setNotFound] = useState<string[]>([])
  const [quickCompanyName, setQuickCompanyName] = useState('')
  const [jdSummarizeOpen, setJdSummarizeOpen] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ApplicationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyId:       initial?.companyId    ?? '',
      companyName:     initial?.companyName  ?? '',
      roleName:        initial?.roleName     ?? '',
      roleUrl:         initial?.roleUrl      ?? '',
      stage:           initial?.stage        ?? 'Interested',
      priority:        initial?.priority     ?? 'Medium',
      workModel:       initial?.workModel,
      jobScope:        initial?.jobScope,
      location:        initial?.location     ?? '',
      salaryMin:       initial?.salaryMin,
      salaryMax:       initial?.salaryMax,
      salaryType:      initial?.salaryType   ?? 'Hourly',
      currency:        initial?.currency     ?? 'ILS',
      fitScore:        initial?.fitScore,
      urgencyScore:    initial?.urgencyScore,
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
    // Merged in until the refetch catches up, then deduped away.
    ...(justCreated && !companies.some(c => c.id === justCreated.id)
      ? [{ value: justCreated.id, label: justCreated.name }]
      : []),
  ]

  // Quick-create a company on the fly so the user doesn't have to leave the
  // form, then fill in the rest of it from the web.
  //
  // The record is created from the name FIRST and the research applied after.
  // Doing it the other way round means a slow or failed lookup costs you the
  // company too, and the name alone is already a usable record.
  async function handleQuickCreateCompany() {
    const name = quickCompanyName.trim()
    if (!name) return

    let created
    try {
      created = await createCompany.mutateAsync({ name })
    } catch {
      return // useCompanyMutations.onError already raised a toast
    }

    setJustCreated(created)
    setValue('companyId',   created.id,   { shouldValidate: true })
    setValue('companyName', created.name, { shouldValidate: true })
    setQuickCompanyName('')

    setEnriching(true)
    const res = await aiService.fillCompany({ companyName: name })
    setEnriching(false)

    if (!res.ok) {
      // The company exists either way; say the details are missing, not that
      // the whole thing failed.
      toast.info(`${created.name} ${t('forms.company.addedWithoutDetails')}`)
      return
    }

    const d = res.data
    try {
      const filled = await updateCompany.mutateAsync({
        id: created.id,
        data: {
          industry:        d.industry || undefined,
          size:            d.size ?? undefined,
          location:        d.location || undefined,
          description:     d.description || undefined,
          website:         d.website ?? undefined,
          linkedinUrl:     d.linkedinUrl ?? undefined,
          glassdoorRating: d.glassdoorRating ?? undefined,
          techStack:       d.techStack?.length ? d.techStack : undefined,
        },
      })
      setJustCreated(filled)
      toast.success(`${created.name} ${t('forms.company.addedWithDetails')}`)
    } catch {
      toast.info(`${created.name} ${t('forms.company.addedWithoutDetails')}`)
    }
  }

  /**
   * Turn a posting link into a filled form.
   *
   * Only empty fields are written. Re-running after you have corrected
   * something must not overwrite the correction — the posting is a starting
   * point, and what you typed is a decision.
   */
  async function handleFillFromPosting() {
    const url = (watch('roleUrl') ?? '').trim()
    if (!url) { toast.error(t('forms.autofill.needUrl')); return }

    setFilling(true)
    setNotFound([])
    const res = await aiService.fillApplication({ jdUrl: url, locale: locale as 'en' | 'he' })
    setFilling(false)

    if (!res.ok) { toast.error(res.message); return }
    const d = res.data

    if (d.sourceNote) { toast.error(d.sourceNote); return }

    const setIfEmpty = (field: keyof ApplicationFormValues, value: unknown) => {
      if (value === null || value === undefined || value === '') return
      const current = watch(field)
      if (current !== undefined && current !== null && current !== '') return
      setValue(field, value as never, { shouldValidate: true, shouldDirty: true })
    }

    setIfEmpty('roleName',       d.roleName)
    setIfEmpty('location',       d.location)
    setIfEmpty('workModel',      d.workModel)
    setIfEmpty('jobScope',       d.jobScope)
    setIfEmpty('salaryMin',      d.salaryMin)
    setIfEmpty('salaryMax',      d.salaryMax)
    setIfEmpty('salaryType',     d.salaryType)
    setIfEmpty('currency',       d.currency)
    setIfEmpty('jobDescription', d.jobDescription)
    setIfEmpty('whyInteresting', d.whyInteresting)

    // The posting names a company that may not be in the CRM yet. Creating it
    // here saves the second trip, and it is researched like any other.
    if (d.companyName && !watch('companyId')) {
      const existing = companies.find(
        c => c.name.trim().toLowerCase() === d.companyName!.trim().toLowerCase(),
      )
      if (existing) {
        setValue('companyId',   existing.id,   { shouldValidate: true })
        setValue('companyName', existing.name, { shouldValidate: true })
      } else {
        setQuickCompanyName(d.companyName)
      }
    }

    setNotFound(d.notFound ?? [])
    toast.success(t('forms.autofill.filled'))
  }

  // Surface the first validation error so the submit doesn't fail silently
  // when the user is scrolled past an invalid field.
  function handleValidationError(errs: Record<string, { message?: string }>) {
    const firstKey = Object.keys(errs)[0]
    const msg = firstKey
      ? (errs[firstKey]?.message ?? `Please fill in "${firstKey}"`)
      : 'Some required fields are missing'
    toast.error(msg)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, handleValidationError)} className="space-y-6" noValidate>
      <FormSection title={t('forms.sections.role')}>
        {companies.length === 0 && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-warning-50 border border-warning-200 text-xs text-warning-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              You don't have any companies yet. Type a name below and click <span className="font-semibold">+ Create</span> to add one on the fly.
            </span>
          </div>
        )}
        <SelectField
          label={t('forms.fields.company')} required
          options={companyOpts}
          error={errors.companyId?.message}
          {...register('companyId')}
        />
        <div className="-mt-2 flex items-center gap-2">
          <input
            type="text"
            value={quickCompanyName}
            onChange={e => setQuickCompanyName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); void handleQuickCreateCompany() }
            }}
            placeholder={t('forms.company.quickPlaceholder')}
            className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-surface"
          />
          <button
            type="button"
            onClick={handleQuickCreateCompany}
            disabled={!quickCompanyName.trim() || createCompany.isPending || enriching}
            className="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3 h-3" />
            {enriching
              ? t('forms.company.researching')
              : createCompany.isPending
                ? t('forms.company.creating')
                : t('forms.company.create')}
          </button>
        </div>
        <FormRow>
          <TextField label={t('forms.fields.roleName')} required placeholder="Senior Product Manager" error={errors.roleName?.message} {...register('roleName')} />
          <TextField label={t('forms.fields.jobPostingUrl')} type="url" placeholder="https://amazon.jobs/…" error={errors.roleUrl?.message} {...register('roleUrl')} />
        </FormRow>

        {/* Fill the form from the posting. Only empty fields are written, so
            re-running never overwrites something you corrected by hand. */}
        <div className="-mt-2 space-y-2">
          <button
            type="button"
            onClick={handleFillFromPosting}
            disabled={filling || !(watch('roleUrl') ?? '').trim()}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {filling ? t('forms.autofill.working') : t('forms.autofill.button')}
          </button>
          <p className="text-2xs text-slate-400">{t('forms.autofill.hint')}</p>

          {notFound.length > 0 && (
            <p className="text-2xs text-warning-700 bg-warning-50 border border-warning-200 rounded-lg px-2.5 py-1.5">
              {t('forms.autofill.notFound')} {notFound.join(', ')}
            </p>
          )}
        </div>
        <FormRow>
          <SelectField label={t('forms.fields.stage')}    required options={STAGE_OPTS}    error={errors.stage?.message}    {...register('stage')} />
          <SelectField label={t('forms.fields.priority')} required options={PRIORITY_OPTS} error={errors.priority?.message} {...register('priority')} />
        </FormRow>
      </FormSection>

      <FormSection title={t('forms.sections.details')}>
        <FormRow cols={3}>
          <SelectField label={t('forms.fields.workModel')} options={WORK_MODEL_OPTS} error={errors.workModel?.message} {...register('workModel', { setValueAs: emptyToUndef })} />
          <SelectField label="Scope" options={JOB_SCOPE_OPTS} error={errors.jobScope?.message} {...register('jobScope', { setValueAs: emptyToUndef })} />
          <TextField   label={t('forms.fields.location')}  placeholder="Tel Aviv · Remote-first" error={errors.location?.message} {...register('location')} />
        </FormRow>
        <FormRow cols={4}>
          <SelectField label="Salary type" options={SALARY_TYPE_OPTS} error={errors.salaryType?.message} {...register('salaryType', { setValueAs: emptyToUndef })} />
          <TextField label="Min" type="number" placeholder="60" error={errors.salaryMin?.message}
            {...register('salaryMin', { setValueAs: v => v === '' ? undefined : Number(v) })} />
          <TextField label="Max" type="number" placeholder="80" error={errors.salaryMax?.message}
            {...register('salaryMax', { setValueAs: v => v === '' ? undefined : Number(v) })} />
          <SelectField label={t('forms.fields.currency')} options={CURRENCY_OPTS} error={errors.currency?.message} {...register('currency')} />
        </FormRow>
        <FormRow>
          <TextField label={t('forms.fields.appliedDate')} type="date" error={errors.appliedAt?.message}  {...register('appliedAt')} />
          <TextField label={t('forms.fields.deadline')}    type="date" error={errors.deadlineAt?.message} {...register('deadlineAt')} />
        </FormRow>
        <FormRow>
          <TextField
            label="Fit (0–100)"
            type="number"
            min={0}
            max={100}
            placeholder="85"
            hint="How well this role matches you"
            error={errors.fitScore?.message}
            {...register('fitScore', { setValueAs: v => v === '' ? undefined : Number(v) })}
          />
          <TextField
            label="Urgency (0–100)"
            type="number"
            min={0}
            max={100}
            placeholder="70"
            hint="How urgent is this opportunity"
            error={errors.urgencyScore?.message}
            {...register('urgencyScore', { setValueAs: v => v === '' ? undefined : Number(v) })}
          />
        </FormRow>
      </FormSection>

      <FormSection title={t('forms.sections.strategy')}>
        <TextareaField label={t('forms.fields.whyInteresting')}  placeholder="What excites me about this role and company…" rows={3} error={errors.whyInteresting?.message}  {...register('whyInteresting')} />
        <TextareaField label={t('forms.fields.whatToEmphasize')} placeholder="Key experiences and skills to highlight in interviews…" rows={3} error={errors.whatToEmphasize?.message} {...register('whatToEmphasize')} />
      </FormSection>

      <FormSection title={t('forms.sections.jobDescription')}>
        <div className="flex items-center justify-end -mb-2">
          <button
            type="button"
            onClick={() => setJdSummarizeOpen(true)}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium bg-primary-gradient text-white shadow-sm hover:brightness-110 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Summarize with AI
          </button>
        </div>
        <TextareaField label={t('forms.fields.jobDescription')} placeholder="Paste the full JD here…" rows={8} className="min-h-[160px]" error={errors.jobDescription?.message} {...register('jobDescription')} />
      </FormSection>

      <JDSummarizeDialog
        open={jdSummarizeOpen}
        onClose={() => setJdSummarizeOpen(false)}
        hasExisting={!!watch('jobDescription')}
        onInsert={(text, mode) => {
          const current = watch('jobDescription') ?? ''
          const next = mode === 'replace'
            ? text
            : (current ? `${current}\n\n${text}` : text)
          setValue('jobDescription', next, { shouldDirty: true, shouldValidate: true })
          toast.success(mode === 'replace' ? 'JD replaced' : 'Summary appended')
        }}
      />

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
