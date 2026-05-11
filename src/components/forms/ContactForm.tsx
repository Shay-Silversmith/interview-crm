// ---------------------------------------------------------------------------
// ContactForm — modal / drawer form for create / edit contacts
// ---------------------------------------------------------------------------
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Contact } from '@/types'
import { makeContactSchema, type ContactFormValues } from '@/lib/schemas/contactSchema'
import { TextField, SelectField, TextareaField } from './Field'
import { FormRow, SubmitBar } from './FormLayout'
import { useI18n } from '@/hooks/useI18n'

interface ContactFormProps {
  initial?: Partial<Contact>
  onSubmit: (values: ContactFormValues) => Promise<void> | void
  onCancel: () => void
  loading?: boolean
}

export function ContactForm({ initial, onSubmit, onCancel, loading }: ContactFormProps) {
  const { t } = useI18n()

  const schema = useMemo(() => makeContactSchema(t), [t])

  const TYPE_OPTS = [
    { value: 'Recruiter',      label: t('forms.options.typeRecruiter') },
    { value: 'Hiring Manager', label: t('forms.options.typeHiringManager') },
    { value: 'HR',             label: t('forms.options.typeHR') },
    { value: 'Employee',       label: t('forms.options.typeEmployee') },
    { value: 'Referral',       label: t('forms.options.typeReferral') },
    { value: 'Other',          label: t('forms.options.typeOther') },
  ]

  const { register, handleSubmit, formState: { errors } } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:          initial?.name ?? '',
      type:          initial?.type ?? 'Recruiter',
      company:       initial?.company ?? '',
      title:         initial?.title ?? '',
      email:         initial?.email ?? '',
      phone:         initial?.phone ?? '',
      linkedinUrl:   initial?.linkedinUrl ?? '',
      notes:         initial?.notes ?? '',
      followUpDueAt: initial?.followUpDueAt ? initial.followUpDueAt.slice(0, 10) : '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormRow>
        <TextField   label={t('forms.fields.fullName')} required placeholder="Maya Cohen" error={errors.name?.message} {...register('name')} />
        <SelectField label={t('forms.fields.type')}     required options={TYPE_OPTS}      error={errors.type?.message} {...register('type')} />
      </FormRow>
      <FormRow>
        <TextField label={t('forms.fields.company')} placeholder="Amazon"    error={errors.company?.message} {...register('company')} />
        <TextField label={t('forms.fields.title')}   placeholder="Recruiter" error={errors.title?.message}   {...register('title')} />
      </FormRow>
      <FormRow>
        <TextField label={t('forms.fields.email')} type="email" placeholder="maya@amazon.com" error={errors.email?.message} {...register('email')} />
        <TextField label="Phone" type="tel" placeholder="+972-50-123-4567" error={errors.phone?.message} {...register('phone')} />
      </FormRow>
      <TextField label={t('forms.fields.linkedinUrl')} placeholder="https://linkedin.com/in/…" error={errors.linkedinUrl?.message} {...register('linkedinUrl')} />
      <TextField label={t('forms.fields.followUpDate')} type="date" error={errors.followUpDueAt?.message} {...register('followUpDueAt')} />
      <TextareaField label={t('forms.fields.notes')} placeholder="How you met, topics discussed…" rows={3} error={errors.notes?.message} {...register('notes')} />
      <SubmitBar
        submitLabel={initial?.id ? t('forms.actions.save') : t('forms.actions.addContact')}
        onCancel={onCancel}
        loading={loading}
      />
    </form>
  )
}
