// ---------------------------------------------------------------------------
// InterviewFlow — Toaster.tsx
// Fixed-position toast stack (bottom-right). Reads from ToastContext.
// ---------------------------------------------------------------------------

import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useToast, type ToastVariant } from '@/hooks/useToast'

const VARIANT_STYLES: Record<ToastVariant, { container: string; icon: string; IconComponent: typeof CheckCircle2 }> = {
  success: {
    container: 'bg-surface border-success-300 shadow-lg',
    icon: 'text-success-500',
    IconComponent: CheckCircle2,
  },
  error: {
    container: 'bg-surface border-danger-300 shadow-lg',
    icon: 'text-danger-500',
    IconComponent: XCircle,
  },
  info: {
    container: 'bg-surface border-primary-200 shadow-lg',
    icon: 'text-primary-500',
    IconComponent: Info,
  },
}

export function Toaster() {
  const { toasts, dismiss } = useToast()
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map(t => {
        const { container, icon, IconComponent } = VARIANT_STYLES[t.variant]
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border min-w-[260px] max-w-sm',
              'animate-slide-in',
              container
            )}
            role="alert"
          >
            <IconComponent className={cn('w-4 h-4 shrink-0', icon)} />
            <p className="flex-1 text-sm text-slate-700">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
