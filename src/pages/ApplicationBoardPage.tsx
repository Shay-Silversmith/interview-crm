import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { StageBadge, PriorityBadge } from '@/components/ui/Badge'
import { CompanyLogo } from '@/components/ui/Avatar'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useMockStore } from '@/hooks/useMockStore'
import { applicationsService } from '@/services/applicationsService'
import { formatDate } from '@/utils/date'
import { cn } from '@/lib/cn'
import type { JobApplication } from '@/types'
import type { ApplicationStage } from '@/lib/enums'
import { STAGE_ORDER } from '@/lib/constants'

const VISIBLE_STAGES: ApplicationStage[] = [
  'Interested', 'Applied', 'HR Screen', 'Home Assignment',
  'Technical Interview', 'Manager Interview', 'Final Interview', 'Offer',
]

const STAGE_META: Record<string, { headerBg: string; dot: string; dropBorder: string; dropBg: string }> = {
  Interested:           { headerBg: 'bg-slate-100',   dot: 'bg-slate-400',    dropBorder: 'border-slate-200',   dropBg: 'bg-slate-50' },
  Applied:              { headerBg: 'bg-primary-50',  dot: 'bg-primary-400',  dropBorder: 'border-primary-200', dropBg: 'bg-primary-50/40' },
  'HR Screen':          { headerBg: 'bg-primary-50',  dot: 'bg-primary-500',  dropBorder: 'border-primary-200', dropBg: 'bg-primary-50/40' },
  'Home Assignment':    { headerBg: 'bg-warning-50',  dot: 'bg-warning-400',  dropBorder: 'border-warning-200', dropBg: 'bg-warning-50/40' },
  'Technical Interview':{ headerBg: 'bg-warning-50',  dot: 'bg-warning-500',  dropBorder: 'border-warning-200', dropBg: 'bg-warning-50/40' },
  'Manager Interview':  { headerBg: 'bg-violet-50',   dot: 'bg-violet-400',   dropBorder: 'border-violet-200',  dropBg: 'bg-violet-50/40' },
  'Final Interview':    { headerBg: 'bg-violet-50',   dot: 'bg-violet-500',   dropBorder: 'border-violet-200',  dropBg: 'bg-violet-50/40' },
  Offer:                { headerBg: 'bg-success-50',  dot: 'bg-success-400',  dropBorder: 'border-success-200', dropBg: 'bg-success-50/40' },
}

export function ApplicationBoardPage() {
  const { data: apps, loading } = useMockStore(() => applicationsService.list())

  const byStage = useMemo(() => {
    const map: Record<ApplicationStage, JobApplication[]> = {} as Record<ApplicationStage, JobApplication[]>
    VISIBLE_STAGES.forEach(s => { map[s] = [] })
    apps?.forEach(a => {
      if (VISIBLE_STAGES.includes(a.stage as ApplicationStage)) {
        map[a.stage as ApplicationStage].push(a)
      }
    })
    return map
  }, [apps])

  return (
    <div className="max-w-full">
      <PageHeader
        title="Pipeline Board"
        description="Kanban view of your active applications"
        actions={
          <Link to="/applications" className="inline-flex items-center gap-2 h-8 px-3 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium">
            <LayoutDashboard className="w-4 h-4" />
            List View
          </Link>
        }
      />

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {VISIBLE_STAGES.map(s => (
            <div key={s} className="w-64 shrink-0 space-y-3">
              <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 md:-mx-6 px-4 md:px-6">
          {VISIBLE_STAGES.map(stage => {
            const stageApps = byStage[stage] ?? []
            const meta = STAGE_META[stage]
            return (
              <div key={stage} className="w-64 shrink-0 flex flex-col gap-2">
                {/* Column header */}
                <div className={cn('flex items-center justify-between px-3 py-2.5 rounded-xl', meta.headerBg)}>
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full shrink-0', meta.dot)} />
                    <span className="text-xs font-semibold text-slate-700 leading-none">{stage}</span>
                  </div>
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white/70 text-2xs font-bold text-slate-600">
                    {stageApps.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 min-h-[120px]">
                  {stageApps.map(app => (
                    <KanbanCard key={app.id} app={app} />
                  ))}
                  {stageApps.length === 0 && (
                    <div className={cn(
                      'flex items-center justify-center h-20 rounded-xl border-2 border-dashed text-xs text-slate-400',
                      meta.dropBorder, meta.dropBg
                    )}>
                      Empty
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-slate-400 mt-2">
        Drag-and-drop persistence is visual-only in Phase 1 — stage changes will be saved in Phase 5.
      </p>
    </div>
  )
}

function KanbanCard({ app }: { app: JobApplication }) {
  return (
    <Link
      to={`/applications/${app.id}`}
      className="block bg-white rounded-xl border border-slate-200 shadow-card p-3 hover:shadow-card-hover hover:-translate-y-px hover:border-slate-300 transition-all group cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={e => e.dataTransfer.setData('text/plain', app.id)}
    >
      <div className="flex items-start gap-2 mb-2.5">
        <CompanyLogo name={app.companyName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 leading-tight group-hover:text-primary-700 transition-colors truncate">
            {app.roleName}
          </p>
          <p className="text-2xs text-slate-400 mt-0.5">{app.companyName}</p>
        </div>
        {app.urgencyScore !== undefined && (
          <ScoreRing score={app.urgencyScore} size="sm" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <PriorityBadge priority={app.priority} />
        {app.submittedCvName && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-2xs text-slate-500 truncate max-w-[80px]">
            {app.submittedCvName}
          </span>
        )}
      </div>
      {app.nextEventAt && (
        <p className="mt-2 text-2xs text-slate-400 border-t border-slate-50 pt-2 truncate">
          {app.nextEventDescription
            ? app.nextEventDescription.split(' — ')[0]
            : formatDate(app.nextEventAt, 'MMM d')}
        </p>
      )}
    </Link>
  )
}
