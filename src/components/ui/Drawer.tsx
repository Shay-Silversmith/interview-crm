import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  side?: 'right' | 'left'
  width?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const widthStyles = {
  sm: 'w-80',
  md: 'w-[420px]',
  lg: 'w-[560px]',
}

export function Drawer({ open, onClose, title, description, side = 'right', width = 'md', children }: DrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        open ? 'pointer-events-auto' : 'pointer-events-none'
      )}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute top-0 bottom-0 flex flex-col bg-surface shadow-modal transition-transform duration-300 ease-out',
          widthStyles[width],
          'max-w-[90vw]',
          side === 'right' ? 'right-0' : 'left-0',
          open
            ? 'translate-x-0'
            : side === 'right'
            ? 'translate-x-full'
            : '-translate-x-full'
        )}
      >
        <div className="flex items-start justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
