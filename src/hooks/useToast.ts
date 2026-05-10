// ---------------------------------------------------------------------------
// InterviewFlow — useToast.ts
// Lightweight toast context. Wrap the app with <ToastProvider>, then call
// useToast() in any component to show success/error/info toasts.
// ---------------------------------------------------------------------------

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  variant: ToastVariant
  message: string
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (message: string, variant?: ToastVariant) => void
  dismiss: (id: string) => void
}

// -- Context -----------------------------------------------------------------
import { createElement } from 'react'

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = Math.random().toString(36).slice(2)
      setToasts(t => [...t, { id, variant, message }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss]
  )

  return createElement(ToastContext.Provider, { value: { toasts, toast, dismiss } }, children)
}

// -- Hook --------------------------------------------------------------------
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// -- Convenience shorthands --------------------------------------------------
export function useToastActions() {
  const { toast } = useToast()
  return {
    success: (msg: string) => toast(msg, 'success'),
    error:   (msg: string) => toast(msg, 'error'),
    info:    (msg: string) => toast(msg, 'info'),
  }
}
