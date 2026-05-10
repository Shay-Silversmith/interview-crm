// ---------------------------------------------------------------------------
// DocumentForm — modal form for create / edit supporting documents
// ---------------------------------------------------------------------------
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Document } from '@/types'
import type { ReactNode } from 'react'
import { makeDocumentSchema, type DocumentFormValues } from '@/lib/schemas/documentSchema'
import { TextField, SelectField, TextareaField } from './Field'
import { SubmitBar } from './FormLayout'
import { useI18n } from '@/hooks/useI18n'

interface DocumentFormProps {
  initial?: Partial<Document>
  onSubmit: (values: DocumentFormValues) => Promise<void> | void
  onCancel: () => void
  loading?: boolean
  /** Slot for file upload UI (e.g. FileDropzone). Replaces the Phase 9 placeholder. */
  fileSlot?: ReactNode
}

export function DocumentForm({ initial, onSubmit, onCancel, loading, fileSlot }: DocumentFormProps) {
  const { t } = useI18n()

  const schema = useMemo(() => makeDocumentSchema(t), [t])

  const TYPE_OPTS = [
    { value: 'CV',               label: t('forms.options.docCV') },
    { value: 'Cover Letter',     label: t('forms.options.docCoverLetter') },
    { value: 'Portfolio',        label: t('forms.options.docPortfolio') },
    { value: 'Certificate',      label: t('forms.options.docCertificate') },
    { value: 'Transcript',       label: t('forms.options.docTranscript') },
    { value: 'Reference Letter', label: t('forms.options.docReferenceLetter') },
    { value: 'Other',            label: t('forms.options.docOther') },
  ]

  const { register, handleSubmit, formState: { errors } } = useForm<DocumentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:  initial?.name  ?? '',
      type:  initial?.type  ?? 'Cover Letter',
      notes: initial?.notes ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <TextField
        label={t('forms.fields.documentName')} required
        placeholder="Amazon Cover Letter — PM"
        error={errors.name?.message}
        {...register('name')}
      />
      <SelectField label={t('forms.fields.type')} required options={TYPE_OPTS} error={errors.type?.message} {...register('type')} />

      {/* File upload slot */}
      {fileSlot}

      <TextareaField
        label={t('forms.fields.notes')} rows={2}
        placeholder="Tailored for Amazon leadership principles…"
        error={errors.notes?.message}
        {...register('notes')}
      />
      <SubmitBar
        submitLabel={initial?.id ? t('forms.actions.save') : t('forms.actions.addDocument')}
        onCancel={onCancel}
        loading={loading}
      />
    </form>
  )
}
