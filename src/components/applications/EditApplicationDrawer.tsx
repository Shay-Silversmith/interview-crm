// ---------------------------------------------------------------------------
// EditApplicationDrawer — right-side drawer for editing application details.
// Covers: role name, URL, location, work model, salary range, submitted CV,
// and notes.  Stage / Priority are intentionally excluded — they have their
// own inline chip controls on the hero.
// ---------------------------------------------------------------------------
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { JobApplication, CVVersion } from '@/types'
import {
  makeApplicationEditSchema,
  emptyToUndef,
  type ApplicationEditFormValues,
} from '@/lib/schemas/applicationSchema'
import { Drawer } from '@/components/ui/Drawer'
import { TextField, SelectField, TextareaField } from '@/components/forms/Field'
import { FormRow, FormSection } from '@/components/forms/FormLayout'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/hooks/useI18n'
import { useComputeFit } from '@/hooks/useComputeFit'
import { fitFromRoleSummary, type FitBreakdown } from '@/lib/fitScore'
import { useApplicationMutations } from '@/hooks/useApplicationMutations'
import { JobDescriptionEditor } from '@/components/applications/JobDescriptionEditor'
import type { PostingFields } from '@/lib/postingFill'

interface EditApplicationDrawerProps {
  open: boolean
  onClose: () => void
  app: JobApplication
  cvVersions: CVVersion[]
}

export function EditApplicationDrawer({
  open,
  onClose,
  app,
  cvVersions,
}: EditApplicationDrawerProps) {
  const { t } = useI18n()
  const { update } = useApplicationMutations()

  const schema = useMemo(() => makeApplicationEditSchema(t), [t])

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
  const CV_OPTS = [
    { value: '', label: t('forms.options.notSpecified') },
    ...cvVersions.map(cv => ({ value: cv.id, label: cv.name })),
  ]

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<ApplicationEditFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      roleName:      app.roleName       ?? '',
      roleUrl:       app.roleUrl        ?? '',
      location:      app.location       ?? '',
      workModel:     app.workModel,
      jobScope:      app.jobScope,
      salaryMin:     app.salaryMin,
      salaryMax:     app.salaryMax,
      salaryType:    app.salaryType     ?? 'Hourly',
      currency:      app.currency       ?? 'ILS',
      fitScore:      app.fitScore,
      urgencyScore:  app.urgencyScore,
      submittedCvId: app.submittedCvId  ?? '',
      jobDescription: app.jobDescription ?? '',
      appliedAt:     app.appliedAt ? app.appliedAt.slice(0, 10) : '',
      notes:         app.notes          ?? '',
    },
  })

  const savedFit = fitFromRoleSummary(app.aiRoleSummary)
  const [freshFit, setFreshFit] = useState<FitBreakdown | null>(null)
  const fit = freshFit ?? savedFit

  const { run: runFit, scoring } = useComputeFit(app.submittedCvId)

  async function handleComputeFit() {
    const computed = await runFit({
      applicationId:  app.id,
      jobDescription: app.jobDescription,
      jobUrl:         app.roleUrl,
      roleName:       app.roleName,
      companyName:    app.companyName,
    })
    if (computed) setFreshFit(computed)
  }

  /**
   * Only empty fields are written. Re-reading the posting after you corrected
   * something must not undo the correction — the posting is a starting point,
   * what you typed is a decision.
   */
  function applyPosting(fields: PostingFields) {
    // whyInteresting lives on the create form only, so it is not in this set.
    const editable = new Set<keyof ApplicationEditFormValues>([
      'roleName', 'location', 'workModel', 'jobScope',
      'salaryMin', 'salaryMax', 'salaryType', 'currency',
    ])
    for (const [key, value] of Object.entries(fields)) {
      const field = key as keyof ApplicationEditFormValues
      if (!editable.has(field)) continue
      const current = watch(field)
      if (current !== undefined && current !== null && current !== '') continue
      setValue(field, value as never, { shouldDirty: true, shouldValidate: true })
    }
  }

  // Re-sync defaults if the app record changes while the drawer is open
  // (e.g. a stage chip update comes in and re-renders the parent)
  const handleClose = () => {
    if (isDirty) {
      if (!confirm('Discard changes?')) return
    }
    reset()
    onClose()
  }

  const onSubmit = async (values: ApplicationEditFormValues) => {
    // Resolve cv name for display
    const cv = cvVersions.find(c => c.id === values.submittedCvId)
    await update.mutateAsync({
      id: app.id,
      data: {
        roleName:        values.roleName,
        roleUrl:         values.roleUrl        || undefined,
        location:        values.location       || undefined,
        workModel:       values.workModel,
        jobScope:        values.jobScope       || undefined,
        salaryMin:       values.salaryMin,
        salaryMax:       values.salaryMax,
        salaryType:      values.salaryType,
        currency:        values.currency,
        fitScore:        values.fitScore,
        urgencyScore:    values.urgencyScore,
        submittedCvId:   values.submittedCvId  || undefined,
        submittedCvName: cv?.name              || undefined,
        jobDescription:  values.jobDescription || undefined,
        appliedAt:       values.appliedAt      || undefined,
        notes:           values.notes          || undefined,
      },
    })
    reset(values) // mark form as clean after success
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={t('pages.applicationDetail.editApplication')}
      description={`${app.roleName} @ ${app.companyName}`}
      width="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormSection title={t('forms.sections.role')}>
          <TextField
            label={t('forms.fields.roleName')}
            required
            placeholder="Senior Product Manager"
            error={errors.roleName?.message}
            {...register('roleName')}
          />
          <TextField
            label={t('forms.fields.jobPostingUrl')}
            type="url"
            placeholder="https://amazon.jobs/…"
            error={errors.roleUrl?.message}
            {...register('roleUrl')}
          />
          <TextField
            label={t('forms.fields.appliedDate')}
            type="date"
            hint={t('forms.fields.appliedDateHint')}
            error={errors.appliedAt?.message}
            {...register('appliedAt')}
          />
        </FormSection>

        <FormSection title={t('forms.sections.details')}>
          <FormRow cols={3}>
            <SelectField
              label={t('forms.fields.workModel')}
              options={WORK_MODEL_OPTS}
              error={errors.workModel?.message}
              {...register('workModel', { setValueAs: emptyToUndef })}
            />
            <SelectField
              label="Scope"
              options={JOB_SCOPE_OPTS}
              error={errors.jobScope?.message}
              {...register('jobScope', { setValueAs: emptyToUndef })}
            />
            <TextField
              label={t('forms.fields.location')}
              placeholder="Tel Aviv · Remote-first"
              error={errors.location?.message}
              {...register('location')}
            />
          </FormRow>
          <FormRow cols={4}>
            <SelectField
              label="Salary type"
              options={SALARY_TYPE_OPTS}
              error={errors.salaryType?.message}
              {...register('salaryType', { setValueAs: emptyToUndef })}
            />
            <TextField
              label="Min"
              type="number"
              placeholder="60"
              error={errors.salaryMin?.message}
              {...register('salaryMin', { setValueAs: v => v === '' ? undefined : Number(v) })}
            />
            <TextField
              label="Max"
              type="number"
              placeholder="80"
              error={errors.salaryMax?.message}
              {...register('salaryMax', { setValueAs: v => v === '' ? undefined : Number(v) })}
            />
            <SelectField
              label={t('forms.fields.currency')}
              options={CURRENCY_OPTS}
              error={errors.currency?.message}
              {...register('currency')}
            />
          </FormRow>
          <FormRow>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t('forms.fields.fit')}
              </label>
              {fit ? (
                <div className="h-9 px-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-sm font-semibold text-slate-800">{fit.score}</span>
                  <span className="text-2xs text-slate-500">
                    {fit.strong} {t('forms.fields.fitStrong')} · {fit.partial} {t('forms.fields.fitPartial')} · {fit.gap} {t('forms.fields.fitGap')}
                  </span>
                </div>
              ) : (
                <div className="h-9 px-3 flex items-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60">
                  <span className="text-xs text-slate-400">—</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleComputeFit}
                disabled={scoring}
                className="mt-1 text-2xs font-medium text-primary-600 hover:underline disabled:opacity-50"
              >
                {scoring
                  ? t('forms.fields.fitWorking')
                  : fit
                    ? t('forms.fields.fitRecompute')
                    : t('forms.fields.fitCompute')}
              </button>
              <p className="text-2xs text-slate-400 mt-1">
                {fit ? t('forms.fields.fitComputed') : t('forms.fields.fitNeedsAnalysis')}
              </p>
            </div>
            <TextField
              label={t('forms.fields.urgency')}
              type="number"
              min={0}
              max={100}
              placeholder="70"
              hint={t('forms.fields.urgencyHint')}
              error={errors.urgencyScore?.message}
              {...register('urgencyScore', { setValueAs: v => v === '' ? undefined : Number(v) })}
            />
          </FormRow>
        </FormSection>

        {cvVersions.length > 0 && (
          <FormSection title={t('forms.fields.versionName')}>
            <SelectField
              label="Submitted CV"
              options={CV_OPTS}
              error={errors.submittedCvId?.message}
              {...register('submittedCvId')}
            />
          </FormSection>
        )}

        <FormSection title={t('forms.sections.jobDescription')}>
          <JobDescriptionEditor
            value={watch('jobDescription') ?? ''}
            onChange={v => setValue('jobDescription', v, { shouldDirty: true })}
            url={watch('roleUrl') ?? ''}
            onFilled={applyPosting}
            rows={8}
          />
        </FormSection>

        <FormSection title={t('forms.sections.privateNotes')}>
          <TextareaField
            label={t('forms.fields.notes')}
            placeholder="Referral contact, insider tips, salary benchmarks…"
            rows={4}
            error={errors.notes?.message}
            {...register('notes')}
          />
        </FormSection>

        {/* Action bar — pinned to bottom of form */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <Button type="submit" className="flex-1" loading={update.isPending}>
            {t('forms.actions.save')}
          </Button>
          <Button type="button" variant="outline" onClick={handleClose} disabled={update.isPending}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Drawer>
  )
}
