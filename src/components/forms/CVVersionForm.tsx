// ---------------------------------------------------------------------------
// CVVersionForm — drawer form for create / edit CV versions
// ---------------------------------------------------------------------------
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles, Loader2 } from 'lucide-react'
import type { CVVersion } from '@/types'
import type { ReactNode } from 'react'
import { makeCVVersionSchema, type CVVersionFormValues } from '@/lib/schemas/cvVersionSchema'
import { TextField, TextareaField, CheckboxField } from './Field'
import { FormRow, FormSection, SubmitBar } from './FormLayout'
import { useI18n } from '@/hooks/useI18n'
import { useToastActions } from '@/hooks/useToast'
import { aiService } from '@/services/aiService'
import { cn } from '@/lib/cn'

interface CVVersionFormProps {
  initial?: Partial<CVVersion>
  onSubmit: (values: CVVersionFormValues) => Promise<void> | void
  onCancel: () => void
  loading?: boolean
  /** Slot for file upload UI (e.g. FileDropzone). Replaces the Phase 9 placeholder. */
  fileSlot?: ReactNode
  /** When provided, the "Extract details from file" AI button is shown.
   *  Pass the same File the FileDropzone is holding. */
  currentFile?: File | null
}

export function CVVersionForm({ initial, onSubmit, onCancel, loading, fileSlot, currentFile }: CVVersionFormProps) {
  const { t } = useI18n()
  const toast = useToastActions()
  const [extracting, setExtracting] = useState(false)

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

  async function handleExtract() {
    if (!currentFile || extracting) return
    setExtracting(true)
    try {
      const base64Data = await fileToBase64(currentFile)
      const { data, fromFallback, fallbackReason } = await aiService.parseCV({
        fileName:   currentFile.name,
        mimeType:   currentFile.type || 'application/pdf',
        base64Data,
      })

      // Apply each non-empty field. Don't overwrite a name the user already typed.
      const currentName = watch('name')
      if (!currentName && data.suggestedName) setValue('name', data.suggestedName, { shouldDirty: true })
      if (data.emphasis) setValue('emphasis', data.emphasis, { shouldDirty: true })
      if (data.skillsHighlighted?.length)
        setValue('skillsHighlighted', data.skillsHighlighted.join(', '), { shouldDirty: true })
      if (data.projectsHighlighted?.length)
        setValue('projectsHighlighted', data.projectsHighlighted.join(', '), { shouldDirty: true })

      if (fromFallback) {
        toast.info(
          fallbackReason === 'disabled'
            ? 'Demo extraction — set VITE_AI_ENABLED=true and run vercel dev for real CV parsing.'
            : 'AI extraction failed; using fallback values.'
        )
      } else {
        toast.success('Highlights extracted from your CV')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Extraction failed')
    } finally {
      setExtracting(false)
    }
  }

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

      {/* File upload slot + AI extract button (visible once a file is picked) */}
      {fileSlot}
      {currentFile && (
        <div className="flex items-center gap-2 flex-wrap -mt-2">
          <button
            type="button"
            onClick={handleExtract}
            disabled={extracting}
            className={cn(
              'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium',
              'bg-primary-gradient text-white shadow-sm hover:brightness-110',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all',
            )}
          >
            {extracting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Sparkles className="w-3.5 h-3.5" />}
            {extracting ? 'Reading CV…' : 'Extract details with AI'}
          </button>
          <span className="text-2xs text-slate-400">Auto-fills emphasis, skills, projects.</span>
        </div>
      )}

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read a File and return its base64 payload (no `data:` prefix). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') return reject(new Error('Unexpected reader result'))
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}
