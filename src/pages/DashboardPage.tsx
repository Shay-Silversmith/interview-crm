// ---------------------------------------------------------------------------
// DashboardPage — restructured into focused sections.
//
// Layout:
//   1. Greeting hero (kept).
//   2. ActionStrip (kept) — only the most urgent CTAs surface here.
//   3. Vertical stack of icon tiles. Each tile shows just the icon + title +
//      a count badge. Click a tile to expand its widget inline. Closed tiles
//      stay compact so the dashboard feels calm at first glance.
// ---------------------------------------------------------------------------

import { useState, useMemo, type ComponentType } from 'react'
import { Briefcase, Calendar, Activity, Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { ActionStrip } from '@/components/dashboard/ActionStrip'
import { TopApplicationsWidget } from '@/components/dashboard/TopApplicationsWidget'
import { UpcomingDeadlinesWidget } from '@/components/dashboard/UpcomingDeadlinesWidget'
import { RecentActivityWidget } from '@/components/dashboard/RecentActivityWidget'
import { QuickAIWidget } from '@/components/dashboard/QuickAIWidget'
import { NextUpCard } from '@/components/dashboard/NextUpCard'
import { CycleStats } from '@/components/dashboard/CycleStats'
import { useMockStore } from '@/hooks/useMockStore'
import { useProfile } from '@/hooks/useProfile'
import { useUser } from '@/hooks/useUser'
import { useI18n } from '@/hooks/useI18n'
import { dashboardService } from '@/services/dashboardService'
import { applicationsService } from '@/services/applicationsService'
import { calendarService } from '@/services/calendarService'
import { tasksService } from '@/services/tasksService'
import { QK } from '@/lib/query-keys'
import { formatDate } from '@/utils/date'
import { cn } from '@/lib/cn'

function getGreetingKey(): 'pages.dashboard.greetingMorning' | 'pages.dashboard.greetingAfternoon' | 'pages.dashboard.greetingEvening' {
  const h = new Date().getHours()
  if (h < 12) return 'pages.dashboard.greetingMorning'
  if (h < 17) return 'pages.dashboard.greetingAfternoon'
  return 'pages.dashboard.greetingEvening'
}

type TileId = 'top-apps' | 'deadlines' | 'activity' | 'ai'

export function DashboardPage() {
  const { data, loading } = useMockStore(() => dashboardService.getDashboardData(), [], { key: QK.dashboard.all() })
  const { data: apps }   = useMockStore(() => applicationsService.list(), [], { key: QK.applications.all() })
  const { data: events } = useMockStore(() => calendarService.list(), [], { key: QK.calendar.all() })
  const { data: tasks }  = useMockStore(() => tasksService.list(), [], { key: QK.tasks.all() })
  const { profile } = useProfile()
  const { user } = useUser()
  const { t } = useI18n()
  const today     = formatDate(new Date(), 'EEEE, MMMM d')
  const firstName =
    profile?.displayName?.trim() ||
    profile?.name?.trim().split(' ')[0] ||
    (user?.email ? user.email.split('@')[0] : 'there')

  // The next real commitment: soonest future interview on the calendar.
  const nextInterview = useMemo(() => {
    const now = Date.now()
    return (events ?? [])
      .filter(e => e.type === 'Interview' && new Date(e.startAt).getTime() >= now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0] ?? null
  }, [events])

  // What is still open on that same application — the prep that matters now.
  const prepTasks = useMemo(() => {
    if (!nextInterview?.applicationId) return []
    return (tasks ?? []).filter(t =>
      t.applicationId === nextInterview.applicationId &&
      t.status !== 'Done' && t.status !== 'Cancelled')
  }, [tasks, nextInterview])

  // Single-expand: only one tile open at a time keeps the page calm
  const [openTile, setOpenTile] = useState<TileId | null>('top-apps')
  const toggle = (id: TileId) => setOpenTile(prev => (prev === id ? null : id))

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Greeting hero */}
      <div className="dot-grid-bg bg-white rounded-2xl border border-slate-200/80 shadow-card px-6 py-5">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 force-ltr">{today}</p>
        <h1 className="text-2xl font-bold text-slate-900">
          {t(getGreetingKey())}, {firstName}.
        </h1>
      </div>

      {/* What is next — the question the dashboard exists to answer */}
      <NextUpCard event={nextInterview} openTasks={prepTasks} />

      {/* Where the search stands */}
      {apps && <CycleStats applications={apps} upcomingCount={data?.upcomingDeadlines.length ?? 0} />}

      {/* Action strip — kept prominent because these are time-sensitive CTAs */}
      {(loading || data) && (
        <ActionStrip data={data!} loading={loading} />
      )}

      {/* Tiles */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : data ? (
        <div className="space-y-3">
          <DashboardTile
            id="top-apps"
            icon={Briefcase}
            iconBg="bg-primary-gradient"
            title={t('pages.dashboard.priorityApplications')}
            description="Applications ranked by urgency"
            count={data.topApplications.length}
            open={openTile === 'top-apps'}
            onToggle={() => toggle('top-apps')}
          >
            <TopApplicationsWidget applications={data.topApplications} />
          </DashboardTile>

          <DashboardTile
            id="deadlines"
            icon={Calendar}
            iconBg="bg-gradient-to-br from-warning-500 to-warning-600"
            title={t('pages.dashboard.upcomingDeadlines')}
            description={t('pages.dashboard.next7Days')}
            count={data.upcomingDeadlines.length}
            open={openTile === 'deadlines'}
            onToggle={() => toggle('deadlines')}
          >
            <UpcomingDeadlinesWidget events={data.upcomingDeadlines} />
          </DashboardTile>

          <DashboardTile
            id="activity"
            icon={Activity}
            iconBg="bg-gradient-to-br from-violet-500 to-violet-600"
            title={t('pages.dashboard.recentActivity') ?? 'Recent activity'}
            description="What's happened lately across your pipeline"
            count={data.recentActivity.length}
            open={openTile === 'activity'}
            onToggle={() => toggle('activity')}
          >
            <RecentActivityWidget activities={data.recentActivity} />
          </DashboardTile>

          <DashboardTile
            id="ai"
            icon={Sparkles}
            iconBg="bg-gradient-to-br from-success-500 to-success-600"
            title="AI tools"
            description="Quick-launch shortcuts for prep, summaries, and follow-ups"
            count={null}
            open={openTile === 'ai'}
            onToggle={() => toggle('ai')}
          >
            <QuickAIWidget />
          </DashboardTile>
        </div>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DashboardTile — collapsible section with a leading colored icon
// ---------------------------------------------------------------------------

function DashboardTile({
  id, icon: Icon, iconBg, title, description, count, open, onToggle, children,
}: {
  id:       string
  icon:     ComponentType<{ className?: string }>
  iconBg:   string
  title:    string
  description: string
  count:    number | null
  open:     boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div
      id={`dashboard-tile-${id}`}
      className={cn(
        'bg-white rounded-2xl border shadow-card overflow-hidden transition-shadow',
        open ? 'border-primary-200 shadow-card-hover' : 'border-slate-200/80 hover:shadow-card-hover',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-start hover:bg-slate-50/60 transition-colors"
      >
        <div className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm',
          iconBg,
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            {count !== null && (
              <span className={cn(
                'inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-2xs font-bold',
                count > 0 ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500',
              )}>
                {count}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>
        </div>
        <div className="shrink-0">
          {open
            ? <ChevronDown className="w-5 h-5 text-slate-400" />
            : <ChevronRight className="w-5 h-5 text-slate-400" />}
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
