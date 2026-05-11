// ---------------------------------------------------------------------------
// ApplicationBoardPage — pipeline overview reimagined.
//
// Two collapsible sections instead of a wide kanban:
//   1. "In progress" — applications still alive in the pipeline, sorted by
//      stage progression DESC (most advanced first), then by priority.
//   2. "History" — closed applications (Rejected / Accepted / Withdrawn).
//
// Each section opens to a vertical list of full-width cards.
// ---------------------------------------------------------------------------

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, Archive, ChevronDown, ChevronRight, MapPin, Calendar, ExternalLink,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StageBadge, PriorityBadge } from '@/components/ui/Badge'
import { CompanyLogo } from '@/components/ui/Avatar'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useMockStore } from '@/hooks/useMockStore'
import { useI18n } from '@/hooks/useI18n'
import { applicationsService } from '@/services/applicationsService'
import { QK } from '@/lib/query-keys'
import { STAGE_ORDER, PRIORITY_WEIGHT } from '@/lib/constants'
import { formatDate, formatRelative } from '@/utils/date'
import { cn } from '@/lib/cn'
import type { JobApplication } from '@/types'
import type { ApplicationStage } from '@/lib/enums'

const CLOSED_STAGES: ApplicationStage[] = ['Rejected', 'Accepted', 'Withdrawn']

export function ApplicationBoardPage() {
  const { t } = useI18n()
  const { data: apps, loading } = useMockStore(
    () => applicationsService.list(),
    [],
    { key: QK.applications.all() }
  )

  // Tile expansion state — start with active expanded for fast access
  const [activeOpen,  setActiveOpen]  = useState(true)
  const [historyOpen, setHistoryOpen] = useState(false)

  const { active, closed } = useMemo(() => {
    const all = apps ?? []
    const stageRank = (s: string) => STAGE_ORDER.indexOf(s)
    const sortByProgress = (a: JobApplication, b: JobApplication) => {
      // Most advanced (highest stage index, but excluding the closed group at the end) first
      const sb = stageRank(b.stage) - stageRank(a.stage)
      if (sb !== 0) return sb
      // Tie-break on priority weight DESC, then most recent applied date
      const pb = (PRIORITY_WEIGHT[b.priority] ?? 0) - (PRIORITY_WEIGHT[a.priority] ?? 0)
      if (pb !== 0) return pb
      const ad = a.appliedAt ? new Date(a.appliedAt).getTime() : 0
      const bd = b.appliedAt ? new Date(b.appliedAt).getTime() : 0
      return bd - ad
    }
    const sortByClosedAt = (a: JobApplication, b: JobApplication) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()

    const active = all.filter(a => !CLOSED_STAGES.includes(a.stage as ApplicationStage)).sort(sortByProgress)
    const closed = all.filter(a => CLOSED_STAGES.includes(a.stage as ApplicationStage)).sort(sortByClosedAt)
    return { active, closed }
  }, [apps])

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={t('pages.board.title')}
        description={t('pages.board.subtitle')}
        actions={
          <Link
            to="/applications"
            className="inline-flex items-center gap-2 h-8 px-3 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
          >
            <LayoutDashboard className="w-4 h-4" />
            {t('pages.board.listView')}
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="space-y-4">
          <SectionTile
            icon={Briefcase}
            iconBg="bg-primary-gradient"
            title="In progress"
            count={active.length}
            subtitle={
              active.length === 0
                ? 'No active applications'
                : `Sorted by stage progression — most advanced first`
            }
            open={activeOpen}
            onToggle={() => setActiveOpen(o => !o)}
          >
            {active.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No active applications"
                description="Add a new application to start tracking your pipeline."
                className="py-10"
              />
            ) : (
              <div className="space-y-2.5">
                {active.map(app => <ApplicationRow key={app.id} app={app} />)}
              </div>
            )}
          </SectionTile>

          <SectionTile
            icon={Archive}
            iconBg="bg-slate-400"
            title="History"
            count={closed.length}
            subtitle={
              closed.length === 0
                ? 'No closed applications yet'
                : `Past applications — accepted, rejected, withdrawn`
            }
            open={historyOpen}
            onToggle={() => setHistoryOpen(o => !o)}
          >
            {closed.length === 0 ? (
              <EmptyState
                icon={Archive}
                title="Nothing here yet"
                description="Closed applications will show up here for reference."
                className="py-10"
              />
            ) : (
              <div className="space-y-2.5">
                {closed.map(app => <ApplicationRow key={app.id} app={app} muted />)}
              </div>
            )}
          </SectionTile>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function SectionTile({
  icon: Icon, iconBg, title, count, subtitle, open, onToggle, children,
}: {
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  title: string
  count: number
  subtitle: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors text-start"
      >
        <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm', iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <span className={cn(
              'inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold',
              count > 0 ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
            )}>
              {count}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="shrink-0">
          {open ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-100 animate-fade-in">
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  )
}

function ApplicationRow({ app, muted }: { app: JobApplication; muted?: boolean }) {
  return (
    <Link
      to={`/applications/${app.id}`}
      className={cn(
        'block bg-white rounded-xl border shadow-card hover:shadow-card-hover hover:-translate-y-px hover:border-primary-200',
        'transition-all p-4',
        muted ? 'border-slate-200 opacity-80' : 'border-slate-200/80'
      )}
    >
      <div className="flex items-start gap-3">
        <CompanyLogo name={app.companyName} size="md" logoUrl={app.companyLogoUrl} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{app.roleName}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {app.companyName}
                {app.location && (
                  <>
                    <span className="text-slate-300 mx-1.5">·</span>
                    <MapPin className="inline w-3 h-3 mb-0.5" /> {app.location}
                  </>
                )}
              </p>
            </div>
            {app.urgencyScore !== undefined && !muted && (
              <ScoreRing score={app.urgencyScore} size="sm" label="" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <StageBadge stage={app.stage} />
            <PriorityBadge priority={app.priority} />
            {app.workModel && (
              <span className="text-2xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{app.workModel}</span>
            )}
            {app.appliedAt && (
              <span className="text-2xs text-slate-400">
                Applied {formatDate(app.appliedAt)}
              </span>
            )}
          </div>

          {app.nextEventAt && app.nextEventDescription && !muted && (
            <div className="mt-2.5 flex items-center gap-1.5 text-2xs text-primary-700 bg-primary-50 border border-primary-100 px-2 py-1 rounded-lg w-fit">
              <Calendar className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {app.nextEventDescription} <span className="text-slate-500 force-ltr">· {formatRelative(app.nextEventAt)}</span>
              </span>
            </div>
          )}
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-1.5 rtl:rotate-90" />
      </div>
    </Link>
  )
}
