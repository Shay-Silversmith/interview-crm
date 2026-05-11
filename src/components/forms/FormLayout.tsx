// ---------------------------------------------------------------------------
// InterviewFlow — FormLayout.tsx
// Layout primitives: FormRow (2-up grid), FormSection (titled block),
// SubmitBar (sticky footer with submit + cancel).
// ---------------------------------------------------------------------------

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/hooks/useI18n'

// -- FormRow -----------------------------------------------------------------
interface FormRowProps {
  children: ReactNode
  cols?: 1 | 2 | 3 | 4
}
export function FormRow({ children, cols = 2 }: FormRowProps) {
  const grid =
    cols === 4 ? 'grid-cols-2 sm:grid-cols-4'
    : cols === 3 ? 'grid-cols-1 sm:grid-cols-3'
    : cols === 2 ? 'grid-cols-1 sm:grid-cols-2'
    : 'grid-cols-1'
  return <div className={`grid ${grid} gap-4`}>{children}</div>
}

// -- FormSection -------------------------------------------------------------
interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}
export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={className}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

// -- SubmitBar ---------------------------------------------------------------
interface SubmitBarProps {
  submitLabel?: string
  onCancel?: () => void
  loading?: boolean
  dirty?: boolean
  className?: string
  extra?: ReactNode
}
export function SubmitBar({
  submitLabel = 'Save',
  onCancel,
  loading = false,
  className = '',
  extra,
}: SubmitBarProps) {
  const { t } = useI18n()
  return (
    <div className={`flex items-center justify-between gap-2 pt-4 border-t border-slate-100 mt-2 ${className}`}>
      <div>{extra}</div>
      <div className="flex items-center gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            {t('common.cancel')}
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
