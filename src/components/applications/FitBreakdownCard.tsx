// ---------------------------------------------------------------------------
// FitBreakdownCard — why the fit score is the number it is.
//
// A percentage nobody can interrogate is worse than no percentage: "60" only
// helps if it also says which requirements cost the other 40 and what closing
// each one is worth. The arithmetic is shown because it is simple enough to
// check: a met requirement is worth a full point, a partial one half, a gap
// nothing.
// ---------------------------------------------------------------------------

import { AlertTriangle, CheckCircle2, CircleDashed } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'
import { computeFit } from '@/lib/fitScore'
import { useI18n } from '@/hooks/useI18n'

interface FitItemLike {
  requirement: string
  level:       'strong' | 'partial' | 'gap' | string
  evidence?:   string
}

interface FitBreakdownCardProps {
  /** The saved Role Analysis. Anything else renders nothing. */
  roleSummary?: unknown
  className?:   string
}

const LEVEL_ORDER = ['gap', 'partial', 'strong'] as const

const LEVEL_STYLE = {
  gap:     { icon: AlertTriangle,  chip: 'bg-danger-50  text-danger-700  border-danger-200',  dot: 'text-danger-500' },
  partial: { icon: CircleDashed,   chip: 'bg-warning-50 text-warning-700 border-warning-200', dot: 'text-warning-500' },
  strong:  { icon: CheckCircle2,   chip: 'bg-success-50 text-success-700 border-success-200', dot: 'text-success-500' },
} as const

export function FitBreakdownCard({ roleSummary, className }: FitBreakdownCardProps) {
  const { t } = useI18n()

  const items = ((roleSummary as { fitAnalysis?: FitItemLike[] } | undefined)?.fitAnalysis ?? [])
    .filter(i => i && typeof i.requirement === 'string')
  const fit = computeFit(items)
  if (!fit) return null

  // What each unmet requirement is worth, in the same points the score uses.
  const perRequirement = 100 / fit.total
  const gapGain     = Math.round(fit.gap     * perRequirement)
  const partialGain = Math.round(fit.partial * perRequirement * 0.5)

  return (
    <Card className={cn('border-slate-200', className)}>
      <div className="flex items-baseline gap-2 mb-1">
        <h3 className="text-sm font-semibold text-slate-700">{t('pages.applicationDetail.fitBreakdown.title')}</h3>
        <span className="text-sm font-bold text-slate-800 ms-auto">{fit.score}</span>
      </div>

      <p className="text-2xs text-slate-500 leading-relaxed mb-3">
        {t('pages.applicationDetail.fitBreakdown.formula', {
          total: fit.total, strong: fit.strong, partial: fit.partial, gap: fit.gap,
        })}
      </p>

      {(fit.gap > 0 || fit.partial > 0) && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 mb-3 space-y-0.5">
          <p className="text-2xs font-semibold text-slate-600">
            {t('pages.applicationDetail.fitBreakdown.raiseTitle')}
          </p>
          {fit.gap > 0 && (
            <p className="text-2xs text-slate-500">
              {t('pages.applicationDetail.fitBreakdown.raiseGaps', { count: fit.gap, points: gapGain })}
            </p>
          )}
          {fit.partial > 0 && (
            <p className="text-2xs text-slate-500">
              {t('pages.applicationDetail.fitBreakdown.raisePartial', { count: fit.partial, points: partialGain })}
            </p>
          )}
        </div>
      )}

      {/* Gaps first: they are the reason someone opens this. */}
      <ul className="space-y-2.5">
        {LEVEL_ORDER.flatMap(level =>
          items.filter(i => i.level === level).map((item, idx) => {
            const style = LEVEL_STYLE[level]
            const Icon  = style.icon
            return (
              <li key={`${level}-${idx}`} className="flex gap-2">
                <Icon className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', style.dot)} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-medium text-slate-700">{item.requirement}</p>
                    <span className={cn('text-2xs border px-1.5 py-px rounded-full font-semibold', style.chip)}>
                      {t(`pages.applicationDetail.fitBreakdown.level.${level}`)}
                    </span>
                  </div>
                  {item.evidence && (
                    <p className="text-2xs text-slate-500 leading-relaxed mt-0.5">{item.evidence}</p>
                  )}
                </div>
              </li>
            )
          }),
        )}
      </ul>
    </Card>
  )
}
