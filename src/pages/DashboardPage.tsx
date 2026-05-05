import { Link } from 'react-router-dom'
import { AlertTriangle, Calendar, Clock, ChevronRight, BookOpen, CheckSquare } from 'lucide-react'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { TopApplicationsWidget } from '@/components/dashboard/TopApplicationsWidget'
import { UpcomingDeadlinesWidget } from '@/components/dashboard/UpcomingDeadlinesWidget'
import { RecentActivityWidget } from '@/components/dashboard/RecentActivityWidget'
import { QuickAIWidget } from '@/components/dashboard/QuickAIWidget'
import { useMockStore } from '@/hooks/useMockStore'
import { dashboardService } from '@/services/dashboardService'
import { mockUser } from '@/data/mock-user'
import { formatDate, formatTime, daysUntil } from '@/utils/date'
import { cn } from '@/lib/cn'
import type { DashboardData } from '@/services/dashboardService'

function getHour() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

interface ActionItem {
  id: string
  type: 'interview' | 'overdue' | 'deadline'
  label: string
  sub: string
  to: string
  cta: string
}

function buildActionItems(data: DashboardData): ActionItem[] {
  const items: ActionItem[] = []

  data.todayInterviews.forEach(e => {
    items.push({
      id: `interview-${e.id}`,
      type: 'interview',
      label: e.title,
      sub: `${formatTime(e.startAt)}${e.companyName ? ` · ${e.companyName}` : ''}`,
      to: e.applicationId ? `/applications/${e.applicationId}?tab=ai` : '/calendar',
      cta: 'Prep',
    })
  })

  data.overdueTasks.slice(0, 3).forEach(t => {
    items.push({
      id: `task-${t.id}`,
      type: 'overdue',
      label: t.title,
      sub: `Overdue${t.companyName ? ` · ${t.companyName}` : ''}`,
      to: '/tasks',
      cta: 'View',
    })
  })

  data.upcomingDeadlines
    .filter(e => daysUntil(e.startAt) <= 2)
    .slice(0, 2)
    .forEach(e => {
      const days = daysUntil(e.startAt)
      items.push({
        id: `deadline-${e.id}`,
        type: 'deadline',
        label: e.title,
        sub: days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`,
        to: '/calendar',
        cta: 'View',
      })
    })

  return items.slice(0, 5)
}

const ACTION_STYLES = {
  interview: {
    stripe: 'bg-violet-500',
    icon: Calendar,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    border: 'border-violet-100',
    bg: 'bg-violet-50/60',
  },
  overdue: {
    stripe: 'bg-danger-500',
    icon: AlertTriangle,
    iconBg: 'bg-danger-100',
    iconColor: 'text-danger-600',
    border: 'border-danger-100',
    bg: 'bg-danger-50/60',
  },
  deadline: {
    stripe: 'bg-warning-500',
    icon: Clock,
    iconBg: 'bg-warning-100',
    iconColor: 'text-warning-600',
    border: 'border-warning-100',
    bg: 'bg-warning-50/60',
  },
}

const CTA_ICONS = {
  Prep: BookOpen,
  View: ChevronRight,
}

export function DashboardPage() {
  const { data, loading } = useMockStore(() => dashboardService.getDashboardData())
  const today = formatDate(new Date(), 'EEEE, MMMM d')
  const firstName = mockUser.name.split(' ')[0]

  const actionItems = data ? buildActionItems(data) : []
  const hasActions = actionItems.length > 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-slate-900">
          Good {getHour()}, {firstName}.
        </h1>
        {!loading && (
          <p className="mt-1 text-sm text-slate-500">
            {hasActions
              ? `${actionItems.length} item${actionItems.length !== 1 ? 's' : ''} need your attention today.`
              : 'All clear — your schedule is clean today.'}
          </p>
        )}
      </div>

      {/* Action inbox */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : hasActions ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {actionItems.map(item => {
            const style = ACTION_STYLES[item.type]
            const CtaIcon = CTA_ICONS[item.cta as keyof typeof CTA_ICONS] ?? ChevronRight
            return (
              <Link
                key={item.id}
                to={item.to}
                className={cn(
                  'relative flex items-center gap-3 px-4 py-3 rounded-2xl border overflow-hidden',
                  'hover:shadow-card-hover hover:-translate-y-px transition-all duration-150',
                  style.bg,
                  style.border
                )}
              >
                {/* Left accent stripe */}
                <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl', style.stripe)} />
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', style.iconBg)}>
                  <style.icon className={cn('w-4 h-4', style.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{item.sub}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 shrink-0">
                  {item.cta}
                  <CtaIcon className="w-3.5 h-3.5" />
                </span>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-success-50 border border-success-100">
          <div className="w-8 h-8 rounded-xl bg-success-100 flex items-center justify-center shrink-0">
            <CheckSquare className="w-4 h-4 text-success-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-success-800">All clear for today</p>
            <p className="text-xs text-success-600 mt-0.5">No overdue tasks, interviews, or immediate deadlines.</p>
          </div>
        </div>
      )}

      {/* Main grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Priority Applications — takes up 2 cols */}
            <div className="xl:col-span-2">
              <TopApplicationsWidget applications={data.topApplications} />
            </div>
            {/* Quick AI — right sidebar */}
            <QuickAIWidget />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Activity feed — 2 cols */}
            <div className="xl:col-span-2">
              <RecentActivityWidget activities={data.recentActivity} />
            </div>
            {/* Upcoming deadlines — right sidebar */}
            <UpcomingDeadlinesWidget events={data.upcomingDeadlines} />
          </div>
        </>
      ) : null}
    </div>
  )
}
