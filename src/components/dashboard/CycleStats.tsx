// ---------------------------------------------------------------------------
// InterviewFlow — CycleStats.tsx
// Where the search actually stands.
//
// Headline counts are stat tiles, not charts — four numbers do not need axes.
// Below them, one single-series magnitude bar shows where the live applications
// are sitting. One hue, light to dark along the pipeline, so depth reads as
// progress; counts are labelled directly, so no legend is needed.
//
// Deliberately NOT shown: stage-to-stage conversion. A closed application only
// stores its final stage, so how far it got before being rejected is not in this
// payload — inventing a funnel from it would be a lie.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom'
import { STAGE_ORDER } from '@/lib/constants'
import type { JobApplication } from '@/types'
import type { ApplicationStage } from '@/lib/enums'

const CLOSED_STAGES: ApplicationStage[] = ['Rejected', 'Accepted', 'Withdrawn']
/** Everything at or past this index means a human has actually engaged. */
const ENGAGED_FROM = STAGE_ORDER.indexOf('HR Screen')

/** Bar shade deepens along the pipeline — same hue, light to dark. */
const SHADES = [
  'bg-primary-200', 'bg-primary-300', 'bg-primary-400',
  'bg-primary-500', 'bg-primary-600', 'bg-primary-700',
]

interface Props {
  applications: JobApplication[]
  upcomingCount: number
}

export function CycleStats({ applications, upcomingCount }: Props) {
  const isClosed = (a: JobApplication) => CLOSED_STAGES.includes(a.stage as ApplicationStage)
  const active   = applications.filter(a => !isClosed(a))
  const archived = applications.filter(isClosed)
  const engaged  = active.filter(a => STAGE_ORDER.indexOf(a.stage) >= ENGAGED_FROM)

  // Only stages that actually hold something — empty rows tell you nothing.
  const pipelineStages = STAGE_ORDER
    .filter(s => !CLOSED_STAGES.includes(s as ApplicationStage))
    .map(stage => ({ stage, count: active.filter(a => a.stage === stage).length }))
    .filter(row => row.count > 0)

  const max = Math.max(1, ...pipelineStages.map(r => r.count))

  const tiles = [
    { label: 'Active',        value: active.length,   hint: 'in the pipeline',        to: '/applications' },
    { label: 'In interviews', value: engaged.length,  hint: 'past the CV stage',      to: '/applications' },
    { label: 'Next 7 days',   value: upcomingCount,   hint: 'scheduled',              to: '/calendar' },
    { label: 'Archived',      value: archived.length, hint: 'closed or withdrawn',    to: '/applications/archive' },
  ]

  return (
    <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-card px-6 py-5">
      <h2 className="text-sm font-bold text-slate-900">Your cycle</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {tiles.map(tile => (
          <Link
            key={tile.label}
            to={tile.to}
            className="group lift-on-hover rounded-xl border border-slate-200/80 bg-surface px-3.5 py-3.5 hover:border-primary-300"
          >
            {/* The number is the reason the tile exists — give it display size
                and tabular figures so the four tiles line up as a row. */}
            <p className="text-3xl font-extrabold text-slate-900 leading-none tracking-tight tabular-nums">
              {tile.value}
            </p>
            <p className="text-xs font-semibold text-slate-700 mt-2 group-hover:text-primary-700 transition-colors">
              {tile.label}
            </p>
            <p className="text-2xs text-slate-400">{tile.hint}</p>
          </Link>
        ))}
      </div>

      {pipelineStages.length > 0 && (
        <div className="mt-6">
          <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Where they are now
          </p>
          <div className="space-y-2">
            {pipelineStages.map((row, i) => (
              <div key={row.stage} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-xs text-slate-600 truncate" title={row.stage}>
                  {row.stage}
                </span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${SHADES[Math.min(i, SHADES.length - 1)]}`}
                    style={{ width: `${(row.count / max) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-end text-xs font-semibold text-slate-700 tabular-nums">
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
