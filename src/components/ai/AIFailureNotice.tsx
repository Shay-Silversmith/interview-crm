// ---------------------------------------------------------------------------
// InterviewFlow — AIFailureNotice.tsx
// One wording for "this did not produce a result", and why.
//
// The previous notice named a vague category and hid the underlying error, so
// the most common local failure — the API functions not running at all — was
// indistinguishable from a bad key or a dropped connection. The cause is now
// stated, the fix is named, and the raw message is one click away.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { FailureReason } from '@/services/aiService'

interface Explanation {
  headline: string
  fix:      string
  settings?: boolean
}

const EXPLANATIONS: Record<FailureReason, Explanation> = {
  'no-key': {
    headline: 'No Gemini API key is set.',
    fix:      'Add your key in Settings — the AI tools call Google with your own key.',
    settings: true,
  },
  disabled: {
    headline: 'Live AI is switched off for this build.',
    fix:      'Set VITE_AI_ENABLED=true in .env.local and restart the dev server. This is a build setting, not your key.',
  },
  'rate-limited': {
    headline: 'Too many AI requests in a short window.',
    fix:      'Wait about a minute and try again.',
  },
  quota: {
    headline: 'Your Gemini key is out of quota.',
    fix:      'Check your usage in Google AI Studio, or wait for the quota window to reset.',
    settings: true,
  },
  timeout: {
    headline: 'The request took too long and was cancelled.',
    fix:      'Research-backed tools can be slow. Try again, or shorten the input.',
  },
  offline: {
    headline: 'Could not reach the AI service.',
    fix:      'Check your internet connection and try again.',
  },
  server: {
    headline: 'The AI request failed.',
    fix:      'The details below say why. If it mentions the endpoint not returning JSON, the API functions are not running.',
  },
}

export function AIFailureNotice({
  reason,
  message,
  className,
  onRetry,
}: {
  reason:   FailureReason
  message?: string
  className?: string
  onRetry?: () => void
}) {
  const [open, setOpen] = useState(false)
  const info = EXPLANATIONS[reason] ?? EXPLANATIONS.server

  return (
    <div
      className={cn(
        'rounded-xl border border-warning-200 bg-warning-50 px-3.5 py-3 text-xs text-warning-900',
        className,
      )}
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <p>
            <span className="font-semibold">{info.headline}</span> {info.fix}
          </p>

          <div className="flex items-center gap-3">
            {info.settings && (
              <Link to="/settings" className="font-medium underline hover:no-underline">
                Open Settings
              </Link>
            )}
            {onRetry && (
              <button onClick={onRetry} className="font-medium underline hover:no-underline">
                Try again
              </button>
            )}
            {message && (
              <button
                onClick={() => setOpen(o => !o)}
                className="inline-flex items-center gap-1 font-medium underline hover:no-underline"
              >
                {open ? 'Hide details' : 'Show details'}
                <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
              </button>
            )}
          </div>

          {open && message && (
            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-warning-100/70 p-2 text-2xs leading-relaxed">
              {message}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
