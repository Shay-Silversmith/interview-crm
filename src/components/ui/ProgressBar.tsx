import { cn } from '@/lib/cn'

interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md'
  color?: 'primary' | 'success' | 'warning' | 'danger'
  label?: string
  showValue?: boolean
  className?: string
}

const colorStyles = {
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  label,
  showValue,
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-xs text-slate-500">{label}</span>}
          {showValue && <span className="text-xs font-medium text-slate-700">{value}%</span>}
        </div>
      )}
      <div
        className={cn('w-full rounded-full bg-slate-100', size === 'sm' ? 'h-1.5' : 'h-2')}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn('h-full rounded-full transition-all', colorStyles[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
