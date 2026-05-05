import { Link } from 'react-router-dom'
import { Video, ChevronRight, BookOpen } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatTime } from '@/utils/date'
import type { CalendarEvent } from '@/types'

interface Props {
  events: CalendarEvent[]
}

export function TodayInterviewsWidget({ events }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Interviews</CardTitle>
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
          {events.length}
        </span>
      </CardHeader>
      {events.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No interviews today"
          description="Your schedule is clear — a good day to prep."
          className="py-8"
        />
      ) : (
        <ul className="space-y-3">
          {events.map(event => (
            <li key={event.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{event.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatTime(event.startAt)}
                  {event.endAt && ` · ${formatTime(event.endAt)}`}
                  {event.companyName && ` · ${event.companyName}`}
                </p>
              </div>
              {event.applicationId && (
                <Link to={`/applications/${event.applicationId}?tab=ai`}>
                  <Button variant="ghost" size="xs" className="shrink-0 gap-1">
                    <BookOpen className="w-3 h-3" />
                    Prep
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
