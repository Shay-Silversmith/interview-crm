// ---------------------------------------------------------------------------
// InterviewFlow — SampleOutputNotice.tsx
// One wording for "this did not come from a model".
//
// Every AI tool falls back to a canned response when there is no key, the
// build flag is off, or the request fails. Those responses read like real
// results — a company profile, CV highlights, a follow-up draft — and a toast
// disappears in three seconds. Anyone who blinked would save invented content
// as fact, which is exactly what happened with a Big Four firm described as a
// 201-500 person B2B SaaS company.
//
// So the notice is persistent, names the actual cause, and says plainly that
// nothing was researched.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import type { FallbackReason } from '@/services/aiService'

const REASONS: Record<FallbackReason, string> = {
  disabled:
    'Live AI is switched off for this build, so nothing was generated. This is a deployment setting, not your API key.',
  'no-key':
    'No Gemini API key is set, so nothing was generated.',
  'rate-limited':
    'Too many AI requests in a short window, so nothing was generated. Wait a minute and try again.',
  'network-error':
    'The AI request did not go through, so nothing was generated.',
  'validation-error':
    'The model replied in a shape this tool could not read, so nothing was generated.',
}

export function SampleOutputNotice({
  reason,
  /** True when placeholder content is on screen rather than withheld. */
  showingSample = false,
  className,
}: {
  reason?: FallbackReason
  showingSample?: boolean
  className?: string
}) {
  const detail = (reason && REASONS[reason]) ?? REASONS['network-error']

  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2.5 text-xs text-warning-900 ${className ?? ''}`}
      role="status"
    >
      <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
      <div className="space-y-1">
        <p>
          <span className="font-semibold">
            {showingSample ? 'This is example text, not a real result.' : 'Nothing was generated.'}
          </span>{' '}
          {detail}
        </p>
        {(reason === 'no-key' || reason === 'disabled') && (
          <Link to="/settings" className="font-medium underline hover:no-underline">
            Set up AI in Settings
          </Link>
        )}
      </div>
    </div>
  )
}
