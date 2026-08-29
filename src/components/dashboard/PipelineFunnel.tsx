// ---------------------------------------------------------------------------
// PipelineFunnel — where the search actually loses momentum.
//
// The old "Where they are now" bars answered "how many sit at each stage",
// which says nothing about whether you are converting. A funnel answers the
// more useful question: of everything you tracked, how far did it get, and
// where does it stop?
//
// IMPORTANT — how the milestones are derived.
// An application stores only its CURRENT stage; there is no transition history.
// So the funnel is NOT built by reading a path, it is built from evidence that
// a milestone was definitely passed:
//   • Applied      — appliedAt is set, or the stage moved past 'Interested'
//   • In process   — an interview round exists, or the stage is at/past 'HR Screen'
//   • Interviewing — a technical/manager/final round exists, or the stage says so
//   • Offer        — the stage is Offer / Negotiating / Accepted
// Closed applications are counted at the furthest milestone they can be PROVEN
// to have reached, never at their closing stage: 'Rejected' sits late in
// STAGE_ORDER, but a rejection can land at any point, and treating its index as
// progress would silently inflate every stage above it.
//
// Milestones are deliberately coarser than STAGE_ORDER. Only these five can be
// established for every record, and a funnel built on guesses about the rest
// would read as precision the data does not have.
// ---------------------------------------------------------------------------

import { useMemo } from 'react'
import { TrendingDown } from 'lucide-react'
import { STAGE_ORDER } from '@/lib/constants'
import { cn } from '@/lib/cn'
import type { JobApplication } from '@/types'

const idx = (stage: string) => STAGE_ORDER.indexOf(stage)

const CLOSED = new Set(['Rejected', 'Accepted', 'Withdrawn'])
const OFFER_STAGES = new Set(['Offer', 'Negotiating', 'Accepted'])

/** Round types that count as a real interview rather than a screen. */
const DEEP_ROUND = /technical|manager|final|home assignment/i
const ANY_SCREEN = /hr|screen|phone|recruiter/i

interface Milestone {
  key: string
  label: string
  hint: string
  count: number
}

function buildMilestones(apps: JobApplication[]): Milestone[] {
  let applied = 0
  let inProcess = 0
  let interviewing = 0
  let offers = 0

  for (const app of apps) {
    const stage = app.stage as string
    const rounds = app.interviewStages ?? []
    const open = !CLOSED.has(stage)
    const stageIdx = open ? idx(stage) : -1 // a closed stage index proves nothing

    const hasApplied = Boolean(app.appliedAt) || (open && stageIdx > idx('Interested'))
    const hasScreen =
      rounds.some(r => ANY_SCREEN.test(r.type) || DEEP_ROUND.test(r.type)) ||
      (open && stageIdx >= idx('HR Screen'))
    const hasDeep =
      rounds.some(r => DEEP_ROUND.test(r.type)) ||
      (open && stageIdx >= idx('Home Assignment'))
    const hasOffer = OFFER_STAGES.has(stage)

    // Later milestones imply the earlier ones, so the counts never invert.
    if (hasOffer || hasDeep || hasScreen || hasApplied) applied++
    if (hasOffer || hasDeep || hasScreen) inProcess++
    if (hasOffer || hasDeep) interviewing++
    if (hasOffer) offers++
  }

  return [
    { key: 'tracked',      label: 'Tracked',      hint: 'saved to the pipeline',    count: apps.length },
    { key: 'applied',      label: 'Applied',      hint: 'submitted',                count: applied },
    { key: 'inProcess',    label: 'In process',   hint: 'reached a screen',         count: inProcess },
    { key: 'interviewing', label: 'Interviewing', hint: 'technical or beyond',      count: interviewing },
    { key: 'offer',        label: 'Offer',        hint: 'offer on the table',       count: offers },
  ]
}

export function PipelineFunnel({ applications }: { applications: JobApplication[] }) {
  const { rows, biggestDropIndex } = useMemo(() => {
    const milestones = buildMilestones(applications)
    const top = Math.max(1, milestones[0].count)

    const rows = milestones.map((m, i) => {
      const prev = i === 0 ? null : milestones[i - 1].count
      // Conversion is undefined, not 0%, when the previous stage was empty.
      const conversion = prev === null ? null : prev === 0 ? null : Math.round((m.count / prev) * 100)
      const lost = prev === null ? 0 : prev - m.count
      return { ...m, widthPct: (m.count / top) * 100, conversion, lost }
    })

    // The single worst step, by absolute applications lost. Ties go to the
    // earlier stage, where a fix pays off across everything downstream.
    let biggestDropIndex = -1
    let worst = 0
    rows.forEach((r, i) => {
      if (i > 0 && r.lost > worst) { worst = r.lost; biggestDropIndex = i }
    })

    return { rows, biggestDropIndex }
  }, [applications])

  if (applications.length === 0) return null

  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">
          Your funnel
        </p>
        <p className="text-2xs text-slate-400">% carried to the next step</p>
      </div>

      {/* An ordered list, not a chart: every value is already readable as text,
          so this is its own accessible fallback rather than needing one. */}
      <ol className="space-y-1.5">
        {rows.map((row, i) => {
          const isDrop = i === biggestDropIndex
          return (
            <li key={row.key} className="group/row">
              <div className="flex items-center gap-3">
                {/* Label and its plain-English definition share the left column.
                    The hint used to sit inside the bar, where it straddled the
                    fill edge and became unreadable at partial widths — and for
                    a derived funnel, the definition is exactly the part the
                    reader must be able to trust. */}
                <div className="w-28 sm:w-36 shrink-0 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{row.label}</p>
                  <p className="text-2xs text-slate-400 truncate">{row.hint}</p>
                </div>

                <div className="flex-1 h-6 rounded-lg bg-slate-100 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-lg transition-all duration-500 ease-entrance',
                      'bg-gradient-to-r from-primary-500 to-primary-600',
                    )}
                    // Zero-count stages still show a sliver so the row reads as
                    // "empty", not "missing".
                    style={{ width: row.count === 0 ? '3px' : `${Math.max(row.widthPct, 6)}%` }}
                  />
                </div>

                <span className="w-8 shrink-0 text-end text-sm font-bold text-slate-900 tabular-nums">
                  {row.count}
                </span>

                <span
                  className={cn(
                    'w-14 shrink-0 text-end text-2xs font-semibold tabular-nums',
                    row.conversion === null
                      ? 'text-slate-400'
                      : isDrop
                        ? 'text-danger-600'
                        : 'text-slate-500',
                  )}
                >
                  {row.conversion === null ? '—' : `${row.conversion}%`}
                </span>
              </div>

              {/* The drop is called out in words as well as colour — the biggest
                  finding on the widget should not depend on seeing red. */}
              {isDrop && row.lost > 0 && (
                <p className="flex items-center gap-1 ps-28 sm:ps-36 mt-1 text-2xs font-medium text-danger-600">
                  <TrendingDown className="w-3 h-3 shrink-0" aria-hidden />
                  Biggest drop — {row.lost} lost here
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
