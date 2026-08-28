// ---------------------------------------------------------------------------
// InterviewFlow — AuthCard.tsx
// Shared shell for the unauthenticated screens (sign in, forgot, reset) so the
// brand header and card chrome stay identical across all of them.
// ---------------------------------------------------------------------------

import type { ReactNode } from 'react'
import { BrandMark } from '@/components/ui/BrandMark'

export function AuthCard({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-card p-8 space-y-6">
        <div className="text-center">
          <BrandMark size="md" className="mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-slate-900">InterviewFlow</h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
