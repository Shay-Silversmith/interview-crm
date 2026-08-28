import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  placeholder?: string
  options: { label: string; value: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, placeholder, options, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-slate-600">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-9 appearance-none rounded-lg border border-slate-200 bg-surface pl-3 pr-8 text-sm text-slate-800',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400',
              'disabled:opacity-50 disabled:bg-slate-50',
              error && 'border-danger-400',
              className
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
        {error && <p className="text-xs text-danger-600">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
