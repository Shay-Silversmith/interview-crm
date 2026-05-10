// ---------------------------------------------------------------------------
// TaskForm — modal form for create / edit tasks
// ---------------------------------------------------------------------------
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Task } from '@/types'
import { makeTaskSchema, type TaskFormValues } from '@/lib/schemas/taskSchema'
import { TextField, SelectField, TextareaField } from './Field'
import { FormRow, SubmitBar } from './FormLayout'
import { useI18n } from '@/hooks/useI18n'

interface TaskFormProps {
  initial?: Partial<Task>
  onSubmit: (values: TaskFormValues) => Promise<void> | void
  onCancel: () => void
  loading?: boolean
}

export function TaskForm({ initial, onSubmit, onCancel, loading }: TaskFormProps) {
  const { t } = useI18n()

  const schema = useMemo(() => makeTaskSchema(t), [t])

  const CATEGORY_OPTS = [
    { value: 'Preparation', label: t('forms.options.catPreparation') },
    { value: 'Follow-up',   label: t('forms.options.catFollowUp') },
    { value: 'Application', label: t('forms.options.catApplication') },
    { value: 'Assignment',  label: t('forms.options.catAssignment') },
    { value: 'Research',    label: t('forms.options.catResearch') },
    { value: 'Admin',       label: t('forms.options.catAdmin') },
  ]
  const PRIORITY_OPTS = [
    { value: 'Critical', label: t('forms.options.priorityCritical') },
    { value: 'High',     label: t('forms.options.priorityHigh') },
    { value: 'Medium',   label: t('forms.options.priorityMedium') },
    { value: 'Low',      label: t('forms.options.priorityLow') },
  ]
  const STATUS_OPTS = [
    { value: 'Todo',        label: t('forms.options.statusTodo') },
    { value: 'In Progress', label: t('forms.options.statusInProgress') },
    { value: 'Done',        label: t('forms.options.statusDone') },
    { value: 'Cancelled',   label: t('forms.options.statusCancelled') },
  ]

  const { register, handleSubmit, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:         initial?.title ?? '',
      description:   initial?.description ?? '',
      category:      initial?.category ?? 'Preparation',
      priority:      initial?.priority ?? 'Medium',
      status:        initial?.status ?? 'Todo',
      dueAt:         initial?.dueAt ? initial.dueAt.slice(0, 10) : '',
      applicationId: initial?.applicationId ?? '',
      companyName:   initial?.companyName ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <TextField
        label={t('forms.fields.title')} required
        placeholder="e.g. Prepare for technical interview"
        error={errors.title?.message}
        {...register('title')}
      />
      <FormRow>
        <SelectField label={t('forms.fields.category')} required options={CATEGORY_OPTS} error={errors.category?.message} {...register('category')} />
        <SelectField label={t('forms.fields.priority')} required options={PRIORITY_OPTS} error={errors.priority?.message} {...register('priority')} />
      </FormRow>
      <FormRow>
        <SelectField label={t('forms.fields.status')}  required options={STATUS_OPTS}   error={errors.status?.message}   {...register('status')} />
        <TextField   label={t('forms.fields.dueDate')} type="date"                      error={errors.dueAt?.message}    {...register('dueAt')} />
      </FormRow>
      <TextareaField
        label={t('forms.fields.description')}
        placeholder="Optional details or notes…"
        rows={3}
        error={errors.description?.message}
        {...register('description')}
      />
      <SubmitBar
        submitLabel={initial?.id ? t('forms.actions.save') : t('forms.actions.addTask')}
        onCancel={onCancel}
        loading={loading}
      />
    </form>
  )
}
