// ---------------------------------------------------------------------------
// CompanyForm — full-page / drawer form for create / edit a company
// ---------------------------------------------------------------------------
import { useState, useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles, Loader2 } from 'lucide-react'
import type { Company } from '@/types'
import { makeCompanySchema, type CompanyFormValues } from '@/lib/schemas/companySchema'
import { TextField, SelectField, TextareaField } from './Field'
import { FormRow, FormSection, SubmitBar } from './FormLayout'
import { useI18n } from '@/hooks/useI18n'
import { useToastActions } from '@/hooks/useToast'
import { aiService } from '@/services/aiService'
import { initials } from '@/utils/format'
import { cn } from '@/lib/cn'

const SIZE_OPTS = [
  { value: '1-10',       label: '1–10 employees' },
  { value: '11-50',      label: '11–50' },
  { value: '51-200',     label: '51–200' },
  { value: '201-500',    label: '201–500' },
  { value: '501-2000',   label: '501–2,000' },
  { value: '2001-10000', label: '2,001–10,000' },
  { value: '10000+',     label: '10,000+' },
]

interface CompanyFormProps {
  initial?: Partial<Company>
  onSubmit: (values: CompanyFormValues) => Promise<void> | void
  onCancel?: () => void
  loading?: boolean
  submitLabel?: string
}

export function CompanyForm({ initial, onSubmit, onCancel, loading, submitLabel }: CompanyFormProps) {
  const { t } = useI18n()

  const schema = useMemo(() => makeCompanySchema(t), [t])

  const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<CompanyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:            initial?.name             ?? '',
      industry:        initial?.industry         ?? '',
      size:            initial?.size,
      location:        initial?.location         ?? '',
      website:         initial?.website          ?? '',
      linkedinUrl:     initial?.linkedinUrl      ?? '',
      logoUrl:         initial?.logoUrl          ?? '',
      description:     initial?.description      ?? '',
      notes:           initial?.notes            ?? '',
      glassdoorRating: initial?.glassdoorRating,
      techStack:       initial?.techStack?.join(', ') ?? '',
    },
  })

  // Logo preview state
  const logoUrlValue  = useWatch({ control, name: 'logoUrl' })
  const websiteValue  = useWatch({ control, name: 'website' })
  const nameValue     = useWatch({ control, name: 'name' })
  const [previewError, setPreviewError] = useState(false)
  const [autoFilling, setAutoFilling] = useState(false)
  const [disambiguation, setDisambiguation] = useState<string | null>(null)
  const [sampleNotice, setSampleNotice]     = useState<string | null>(null)
  const toast = useToastActions()

  // Reset error whenever the URL changes so a new URL gets a fresh attempt
  useEffect(() => { setPreviewError(false) }, [logoUrlValue])

  const handleFaviconSuggest = () => {
    if (!websiteValue) return
    try {
      const host = new URL(websiteValue).hostname
      setValue('logoUrl', `https://www.google.com/s2/favicons?domain=${host}&sz=128`, { shouldDirty: true })
    } catch {
      // Invalid URL — no-op
    }
  }

  const handleAIAutofill = async () => {
    const name = (nameValue ?? '').trim()
    if (!name || autoFilling) return

    setAutoFilling(true)
    setDisambiguation(null)
    try {
      const res = await aiService.fillCompany({ companyName: name })

      // A failed lookup must not touch the form: writing a guess into these
      // fields turns it into a saved company fact. Report and leave it alone.
      if (!res.ok) {
        setSampleNotice(`${res.message} No fields were changed.`)
        return
      }
      setSampleNotice(null)
      const { data } = res

      // Apply each non-empty field. Don't overwrite name (user typed it).
      if (data.industry)            setValue('industry',        data.industry,          { shouldDirty: true })
      if (data.size)                setValue('size',            data.size,              { shouldDirty: true })
      if (data.location)            setValue('location',        data.location,          { shouldDirty: true })
      if (data.description)         setValue('description',     data.description,       { shouldDirty: true })
      if (data.website)             setValue('website',         data.website,           { shouldDirty: true })
      if (data.linkedinUrl)         setValue('linkedinUrl',     data.linkedinUrl,       { shouldDirty: true })
      if (data.glassdoorRating !== null && data.glassdoorRating !== undefined)
        setValue('glassdoorRating', data.glassdoorRating,       { shouldDirty: true })
      if (data.techStack?.length)   setValue('techStack',       data.techStack.join(', '), { shouldDirty: true })

      // Derive a logo URL from the website domain when one was returned.
      if (data.website) {
        try {
          const host = new URL(data.website).hostname
          setValue('logoUrl', `https://www.google.com/s2/favicons?domain=${host}&sz=128`, { shouldDirty: true })
        } catch { /* skip */ }
      }

      if (data.disambiguation) setDisambiguation(data.disambiguation)

      toast.success('Company details filled from web research')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Auto-fill failed')
    } finally {
      setAutoFilling(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <FormSection title={t('forms.sections.basics')}>
        <div className="space-y-1.5">
          <TextField
            label={t('forms.fields.companyName')} required
            placeholder="Amazon"
            error={errors.name?.message}
            {...register('name')}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleAIAutofill}
              disabled={!nameValue?.trim() || autoFilling}
              className={cn(
                'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium',
                'bg-primary-gradient text-white shadow-sm hover:brightness-110',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all',
              )}
            >
              {autoFilling
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Sparkles className="w-3.5 h-3.5" />}
              {autoFilling ? 'Researching…' : 'Auto-fill with AI'}
            </button>
            <span className="text-2xs text-slate-400">
              Type the company name above, then click to research.
            </span>
          </div>
          {sampleNotice && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-warning-50 border border-warning-200 text-xs text-warning-800">
              <span className="font-semibold">Nothing was filled in:</span> {sampleNotice}
            </div>
          )}
          {disambiguation && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-warning-50 border border-warning-200 text-xs text-warning-800">
              <span className="font-semibold">Heads up:</span> {disambiguation}
            </div>
          )}
        </div>
        <FormRow>
          <TextField    label={t('forms.fields.industry')} placeholder="Technology · E-commerce" error={errors.industry?.message} {...register('industry')} />
          <SelectField  label={t('forms.fields.size')}     options={SIZE_OPTS} placeholder="Select size…" error={errors.size?.message} {...register('size')} />
        </FormRow>
        <TextField label={t('forms.fields.location')} placeholder="Tel Aviv · Remote" error={errors.location?.message} {...register('location')} />
      </FormSection>

      <FormSection title={t('forms.sections.onlinePresence')}>
        <FormRow>
          <TextField label={t('forms.fields.website')}     type="url" placeholder="https://amazon.jobs"                         error={errors.website?.message}    {...register('website')} />
          <TextField label={t('forms.fields.linkedinUrl')} type="url" placeholder="https://linkedin.com/company/amazon"          error={errors.linkedinUrl?.message} {...register('linkedinUrl')} />
        </FormRow>

        {/* Logo URL — URL input + one-click favicon helper + live preview */}
        <div className="space-y-2">
          <TextField
            label={t('forms.fields.logoUrl')}
            type="url"
            placeholder="https://www.google.com/s2/favicons?domain=amazon.com&sz=128"
            error={errors.logoUrl?.message}
            {...register('logoUrl')}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleFaviconSuggest}
              className="text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors disabled:opacity-40"
              disabled={!websiteValue}
            >
              ↗ {t('forms.hints.useFavicon')}
            </button>

            {/* Live preview — falls back to initials box on image error */}
            {logoUrlValue && (
              <div className="w-8 h-8 rounded-lg border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center bg-slate-50">
                {!previewError ? (
                  <img
                    src={logoUrlValue}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                    onError={() => setPreviewError(true)}
                  />
                ) : (
                  <span className={cn('text-xs font-bold text-slate-500')}>
                    {initials(initial?.name ?? 'Co').slice(0, 2)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title={t('forms.sections.research')}>
        <TextareaField
          label={t('forms.fields.description')}
          placeholder="What the company does, their culture, recent news…"
          rows={4}
          error={errors.description?.message}
          {...register('description')}
        />
        <FormRow>
          <TextField
            label={t('forms.fields.glassdoorRating')}
            type="number" step="0.1" min={0} max={5}
            placeholder="4.2"
            error={errors.glassdoorRating?.message}
            {...register('glassdoorRating', { setValueAs: v => v === '' ? undefined : Number(v) })}
          />
          <TextField
            label={t('forms.fields.techStack')}
            placeholder="React, TypeScript, Go, AWS"
            hint={t('forms.hints.commaSeparated')}
            error={errors.techStack?.message}
            {...register('techStack')}
          />
        </FormRow>
        <TextareaField
          label={t('forms.sections.privateNotes')}
          placeholder="Referral from Yael, apply by end of month…"
          rows={3}
          error={errors.notes?.message}
          {...register('notes')}
        />
      </FormSection>

      <SubmitBar
        submitLabel={submitLabel ?? (initial?.id ? t('forms.actions.save') : t('forms.actions.addCompany'))}
        onCancel={onCancel}
        loading={loading}
      />
    </form>
  )
}
