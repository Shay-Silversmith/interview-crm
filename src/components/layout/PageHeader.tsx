import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

// justify-between and items-start are direction-agnostic.
// text-start (logical) instead of text-left so headings align to the
// reading start edge in both LTR and RTL layouts.
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-5', className)}>
      <div className="text-start">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
