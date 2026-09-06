// ---------------------------------------------------------------------------
// CVAvatar — the square on a CV card.
//
// Shows the logo of the company the CV was written for, because that is how the
// list is actually read ("which one did I send to Google?"). Falls back to the
// version badge it used to be whenever no company can be resolved or every
// logo URL fails, so a bad guess is invisible rather than wrong.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { logoCandidates } from '@/lib/companyLogo'

interface CVAvatarProps {
  version:     number | string
  isActive?:   boolean
  companyName?: string
  companyLogoUrl?: string
  className?:  string
}

export function CVAvatar({ version, isActive, companyName, companyLogoUrl, className }: CVAvatarProps) {
  const candidates = companyName
    ? logoCandidates({ logoUrl: companyLogoUrl, name: companyName })
    : []
  const [attempt, setAttempt] = useState(0)
  const src = candidates[attempt]

  const box = cn(
    'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0',
    className,
  )

  if (src) {
    return (
      <div
        className={cn(box, 'overflow-hidden border bg-white', isActive ? 'border-primary-200' : 'border-slate-200')}
        title={companyName}
      >
        <img
          key={src}
          src={src}
          alt={`${companyName} logo`}
          className="w-7 h-7 object-contain"
          onError={() => setAttempt(a => a + 1)}
        />
      </div>
    )
  }

  return (
    <div className={cn(
      box, 'text-base font-bold',
      isActive ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400',
    )}>
      v{version}
    </div>
  )
}
