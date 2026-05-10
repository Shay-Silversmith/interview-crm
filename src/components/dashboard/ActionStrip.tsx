// ---------------------------------------------------------------------------
// ActionStrip — urgent-item chips displayed at the top of the Dashboard.
// Sources: interviews within 24h, overdue tasks, deadlines within 7 days,
// top-priority applications with no activity for 7+ days.
// ---------------------------------------------------------------------------
import { Link } from 'react-router-dom'
import {
  Calendar, AlertTriangle, Clock, Briefcase, CheckSquare, ChevronRight, BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatTime, daysUntil } from '@/utils/date'
import { differenceInDays, parseISO } from 'date-fns'
import type { DashboardData } from '@/services/dashboardService'
import type { JobApplication } from '@/types'
import { useI18n } from '@/hooks/useI18n'

// ── Item types ───────────────────────────────────────────────────────────────

interface ActionItem {
  id:    string
  type:  'interview' | 'overdue' | 'deadline' | 'stale'
  label: string
  sub:   string
  to:    string
  ctaKey: 'ctaPrep' | 'ctaView'
}

const STYLE = {
  interview: {
    stripe:    'bg-violet-500',
    icon:      Calendar,
    iconBg:    'bg-violet-100',
    iconColor: 'text-violet-600',
    border:    'border-violet-200',
    bg:        'bg-violet-50/70',
  },
  overdue: {
    stripe:    'bg-rose-500',
    icon:      AlertTriangle,
    iconBg:    'bg-rose-100',
    iconColor: 'text-rose-600',
    border:    'border-rose-200',
    bg:        'bg-rose-50/70',
  },
  deadline: {
    stripe:    'bg-amber-500',
    icon:      Clock,
    iconBg:    'bg-amber-100',
    iconColor: 'text-amber-600',
    border:    'border-amber-200',
    bg:        'bg-amber-50/70',
  },
  stale: {
    stripe:    'bg-indigo-500',
    icon:      Briefcase,
    iconBg:    'bg-indigo-100',
    iconColor: 'text-indigo-600',
    border:    'border-indigo-200',
    bg:        'bg-indigo-50/70',
  },
}

// ── Builder ──────────────────────────────────────────────────────────────────

function buildItems(
  data: DashboardData,
  overdue: string,
  today: string,
  tomorrow: string,
  inDays: (count: number) => string,
): ActionItem[] {
  const items: ActionItem[] = []
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  // Next interview within 24 h
  data.todayInterviews
    .filter(e => new Date(e.startAt) <= in24h)
    .slice(0, 1)
    .forEach(e => items.push({
      id:     `interview-${e.id}`,
      type:   'interview',
      label:  e.title,
      sub:    `${formatTime(e.startAt)}${e.companyName ? ` · ${e.companyName}` : ''}`,
      to:     e.applicationId ? `/applications/${e.applicationId}?tab=ai` : '/calendar',
      ctaKey: 'ctaPrep',
    }))

  // Top overdue task
  data.overdueTasks.slice(0, 1).forEach(t => items.push({
    id:     `task-${t.id}`,
    type:   'overdue',
    label:  t.title,
    sub:    `${overdue}${t.companyName ? ` · ${t.companyName}` : ''}`,
    to:     '/tasks',
    ctaKey: 'ctaView',
  }))

  // Next deadline within 7 days
  data.upcomingDeadlines
    .filter(e => daysUntil(e.startAt) <= 7)
    .slice(0, 1)
    .forEach(e => {
      const d = daysUntil(e.startAt)
      items.push({
        id:     `deadline-${e.id}`,
        type:   'deadline',
        label:  e.title,
        sub:    d === 0 ? today : d === 1 ? tomorrow : inDays(d),
        to:     '/calendar',
        ctaKey: 'ctaView',
      })
    })

  // Stale top-priority application (no activity ≥ 7 days)
  const staleApp: JobApplication | undefined = data.topApplications
    .filter(a => differenceInDays(now, parseISO(a.updatedAt)) >= 7)
    .sort((a, b) => (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0))[0]

  if (staleApp) {
    items.push({
      id:     `stale-${staleApp.id}`,
      type:   'stale',
      label:  `${staleApp.roleName} @ ${staleApp.companyName}`,
      sub:    inDays(differenceInDays(now, parseISO(staleApp.updatedAt))),
      to:     `/applications/${staleApp.id}`,
      ctaKey: 'ctaView',
    })
  }

  return items.slice(0, 5)
}

// ── Component ────────────────────────────────────────────────────────────────

interface ActionStripProps {
  data:    DashboardData
  loading: boolean
}

const CTA_ICON = {
  ctaPrep: BookOpen,
  ctaView: ChevronRight,
}

export function ActionStrip({ data, loading }: ActionStripProps) {
  const { t } = useI18n()

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  const items = buildItems(
    data,
    t('pages.dashboard.overdue'),
    t('pages.dashboard.today'),
    t('pages.dashboard.tomorrow'),
    (count) => t('pages.dashboard.inDays', { count }),
  )

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-success-50 border border-success-100">
        <div className="w-8 h-8 rounded-xl bg-success-100 flex items-center justify-center shrink-0">
          <CheckSquare className="w-4 h-4 text-success-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-success-800">{t('pages.dashboard.allClear')}</p>
          <p className="text-xs text-success-600 mt-0.5">{t('pages.dashboard.allClearSub')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {items.map(item => {
        const s = STYLE[item.type]
        const CtaIcon = CTA_ICON[item.ctaKey]
        return (
          <Link
            key={item.id}
            to={item.to}
            className={cn(
              'relative flex items-center gap-3 px-4 py-3 rounded-2xl border overflow-hidden',
              'hover:shadow-card-hover hover:-translate-y-px transition-all duration-150',
              s.bg, s.border,
            )}
          >
            <div className={cn('absolute start-0 top-0 bottom-0 w-1 rounded-s-2xl', s.stripe)} />
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', s.iconBg)}>
              <s.icon className={cn('w-4 h-4', s.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{item.label}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{item.sub}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 shrink-0">
              {t(`pages.dashboard.${item.ctaKey}`)}<CtaIcon className="w-3.5 h-3.5" />
            </span>
          </Link>
        )
      })}
    </div>
  )
}
