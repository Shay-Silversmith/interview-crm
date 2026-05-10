import { Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { EventTypeBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatTime, daysUntil } from '@/utils/date'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/cn'
import type { CalendarEvent } from '@/types'

interface Props {
  events: CalendarEvent[]
}

export function UpcomingDeadlinesWidget({ events }: Props) {
  const { t } = useI18n()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pages.dashboard.upcomingDeadlines')}</CardTitle>
        <span className="text-xs text-slate-400">{t('pages.dashboard.next7Days')}</span>
      </CardHeader>
      {events.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={t('pages.dashboard.noUpcomingDeadlines')}
          description={t('pages.dashboard.noUpcomingDeadlinesSub')}
          className="py-8"
        />
      ) : (
        <ul className="space-y-3">
          {events.slice(0, 5).map(event => {
            const days = daysUntil(event.startAt)
            return (
              <li key={event.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0',
                    days <= 1
                      ? 'bg-danger-100 text-danger-700'
                      : days <= 3
                      ? 'bg-warning-100 text-warning-700'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {days === 0 ? t('pages.dashboard.now') : `${days}d`}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 leading-snug truncate">
                    {event.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 force-ltr">
                    {formatDate(event.startAt)} · {formatTime(event.startAt)}
                    {event.companyName && ` · ${event.companyName}`}
                  </p>
                </div>
                <EventTypeBadge type={event.type} />
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
