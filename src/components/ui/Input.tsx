import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  // Interactive trailing content (a show/hide password toggle, a clear button).
  // Kept separate from `rightIcon` because that slot is pointer-events-none by
  // design — decorative icons must never steal a click meant for the field.
  rightSlot?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, rightSlot, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-slate-600">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-slate-400 pointer-events-none">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error && inputId ? `${inputId}-error` : undefined}
            className={cn(
              'w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800',
              'placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400',
              'disabled:opacity-50 disabled:bg-slate-50',
              error && 'border-danger-400 focus:ring-danger-500/30 focus:border-danger-400',
              leftIcon && 'pl-9',
              (rightIcon || rightSlot) && 'pr-9',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-slate-400 pointer-events-none">{rightIcon}</span>
          )}
          {rightSlot && <span className="absolute right-2 flex items-center">{rightSlot}</span>}
        </div>
        {error && (
          <p id={inputId ? `${inputId}-error` : undefined} className="text-xs text-danger-600">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-slate-600">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800',
            'placeholder:text-slate-400 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400',
            'disabled:opacity-50 disabled:bg-slate-50',
            error && 'border-danger-400 focus:ring-danger-500/30',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger-600">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
