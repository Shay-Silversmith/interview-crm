// ---------------------------------------------------------------------------
// InterviewFlow — CycleStats.tsx
// Where the search actually stands.
//
// Headline counts are stat tiles, not charts — four numbers do not need axes.
//
// This file used to say a funnel was impossible here, because a closed
// application stores only its final stage and reading progress off that would
// be a lie. That objection still stands and PipelineFunnel honours it: it never
// treats a closing stage as progress. What it uses instead is evidence the
// original note did not account for — appliedAt, and the interviewStages rounds
// that actually took place — so a rejected application lands at the furthest
// milestone it can be PROVEN to have reached.
//
// The price is resolution: five provable milestones rather than eight stages.
// That is the honest ceiling until applications carry a transition history.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom'
import { STAGE_ORDER } from '@/lib/constants'
import { PipelineFunnel } from './PipelineFunnel'
import type { JobApplication } from '@/types'
import type { ApplicationStage } from '@/lib/enums'

const CLOSED_STAGES: ApplicationStage[] = ['Rejected', 'Accepted', 'Withdrawn']
/** Everything at or past this index means a human has actually engaged. */
const ENGAGED_FROM = STAGE_ORDER.indexOf('HR Screen')

interface Props {
  applications: JobApplication[]
  upcomingCount: number
}

export function CycleStats({ applications, upcomingCount }: Props) {
  const isClosed = (a: JobApplication) => CLOSED_STAGES.includes(a.stage as ApplicationStage)
  const active   = applications.filter(a => !isClosed(a))
  const archived = applications.filter(isClosed)
  const engaged  = active.filter(a => STAGE_ORDER.indexOf(a.stage) >= ENGAGED_FROM)

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

      <PipelineFunnel applications={applications} />
    </div>
  )
}
