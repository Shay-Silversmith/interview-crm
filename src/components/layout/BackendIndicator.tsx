// ---------------------------------------------------------------------------
// InterviewFlow — BackendIndicator.tsx
// Small pill in the Topbar showing whether the app is in Live or Mock mode.
// force-ltr: technical labels ("Live" / "Mock") always render left-to-right.
// ---------------------------------------------------------------------------

import { Database, Server } from 'lucide-react'
import { isSupabaseMode } from '@/lib/env'

export function BackendIndicator() {
  const live = isSupabaseMode()

  return (
    <div
      title={live ? 'Connected to Supabase — live data' : 'Using mock data — no backend required'}
      className={[
        // force-ltr: technical text should never mirror in Hebrew mode
        'force-ltr flex items-center gap-1 px-2 h-6 rounded-full text-xs font-medium select-none',
        live
          ? 'bg-success-50 text-success-700 border border-success-200'
          : 'bg-slate-100 text-slate-500 border border-slate-200',
      ].join(' ')}
    >
      {live ? (
        <Database className="w-3 h-3 shrink-0" />
      ) : (
        <Server className="w-3 h-3 shrink-0" />
      )}
      <span>{live ? 'Live' : 'Mock'}</span>
    </div>
  )
}
