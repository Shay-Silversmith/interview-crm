// ---------------------------------------------------------------------------
// EditApplicationDrawer — right-side drawer for editing application details.
// Covers: role name, URL, location, work model, salary range, submitted CV,
// and notes.  Stage / Priority are intentionally excluded — they have their
// own inline chip controls on the hero.
// ---------------------------------------------------------------------------
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { JobApplication, CVVersion } from '@/types'
import {
  makeApplicationEditSchema,
  type ApplicationEditFormValues,
} from '@/lib/schemas/applicationSchema'
import { Drawer } from '@/components/ui/Drawer'
import { TextField, SelectField, TextareaField } from '@/components/forms/Field'
import { FormRow, FormSection } from '@/components/forms/FormLayout'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/hooks/useI18n'
import { useApplicationMutations } from '@/hooks/useApplicationMutations'

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
    formState: { errors, isDirty },
    reset,
  } = useForm<ApplicationEditFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      roleName:      app.roleName       ?? '',
      roleUrl:       app.roleUrl        ?? '',
      location:      app.location       ?? '',
      workModel:     app.workModel,
      salaryMin:     app.salaryMin,
      salaryMax:     app.salaryMax,
      currency:      app.currency       ?? 'ILS',
      submittedCvId: app.submittedCvId  ?? '',
      notes:         app.notes          ?? '',
    },
  })

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
        roleName:       values.roleName,
        roleUrl:        values.roleUrl        || undefined,
        location:       values.location       || undefined,
        workModel:      values.workModel,
        salaryMin:      values.salaryMin,
        salaryMax:      values.salaryMax,
        currency:       values.currency,
        submittedCvId:  values.submittedCvId  || undefined,
        submittedCvName: cv?.name             || undefined,
        notes:          values.notes          || undefined,
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
        </FormSection>

        <FormSection title={t('forms.sections.details')}>
          <FormRow>
            <SelectField
              label={t('forms.fields.workModel')}
              options={WORK_MODEL_OPTS}
              error={errors.workModel?.message}
              {...register('workModel')}
            />
            <TextField
              label={t('forms.fields.location')}
              placeholder="Tel Aviv · Remote-first"
              error={errors.location?.message}
              {...register('location')}
            />
          </FormRow>
          <FormRow cols={3}>
            <TextField
              label={t('forms.fields.minSalary')}
              type="number"
              placeholder="18000"
              error={errors.salaryMin?.message}
              {...register('salaryMin', { setValueAs: v => v === '' ? undefined : Number(v) })}
            />
            <TextField
              label={t('forms.fields.maxSalary')}
              type="number"
              placeholder="25000"
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
