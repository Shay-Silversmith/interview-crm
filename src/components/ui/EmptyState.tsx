import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className
      )}
    >
      {/* Soft halo: ring+bg instead of a flat square */}
      <div className="w-12 h-12 rounded-2xl bg-slate-50 ring-1 ring-slate-200/60 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold tracking-tight text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs">{description}</p>
      {action && (
        <Button variant="primary" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
