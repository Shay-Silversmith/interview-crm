// ---------------------------------------------------------------------------
// InterviewFlow — Field.tsx
// Thin wrappers that connect react-hook-form's Controller / register
// to the existing Input, Select, Textarea primitives.
// ---------------------------------------------------------------------------

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/cn'

// -- TextInput field ---------------------------------------------------------
interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, required, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-600">
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <Input ref={ref} error={error} {...props} />
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
)
TextField.displayName = 'TextField'

// -- SelectField -------------------------------------------------------------
interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  placeholder?: string
  options: { label: string; value: string }[]
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, required, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-600">
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <Select ref={ref} error={error} {...props} />
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
)
SelectField.displayName = 'SelectField'

// -- TextareaField -----------------------------------------------------------
interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, required, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-600">
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <Textarea ref={ref} error={error} className={cn('min-h-[80px]', className)} {...props} />
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
)
TextareaField.displayName = 'TextareaField'

// -- CheckboxField -----------------------------------------------------------
interface CheckboxFieldProps {
  label: string
  description?: string
  error?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}

export function CheckboxField({ label, description, error, checked, onChange, disabled }: CheckboxFieldProps) {
  return (
    <label className={cn('flex items-start gap-2.5 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange?.(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500/30"
      />
      <div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
        {error && <p className="text-xs text-danger-600 mt-0.5">{error}</p>}
      </div>
    </label>
  )
}
