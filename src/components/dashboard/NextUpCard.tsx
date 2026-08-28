// ---------------------------------------------------------------------------
// InterviewFlow — NextUpCard.tsx
// The one thing the dashboard should answer before anything else: what is the
// next real commitment, and am I ready for it.
//
// This is a hero number, not a chart — a single value (days remaining) with the
// context needed to act on it.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom'
import { CalendarClock, MapPin, User, ArrowRight, CheckCircle2 } from 'lucide-react'
import { CompanyLogo } from '@/components/ui/Avatar'
import { formatDate, formatTime, daysUntil } from '@/utils/date'
import type { CalendarEvent, Task } from '@/types'

interface Props {
  event: CalendarEvent | null
  /** Open tasks tied to the same application — what is left before the room. */
  openTasks: Task[]
}

/** "Today" / "Tomorrow" / "in 3 days" — a countdown people read at a glance. */
function countdownLabel(startAt: string): string {
  const days = daysUntil(startAt)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 7) return `in ${days} days`
  if (days < 14) return 'next week'
  return `in ${Math.round(days / 7)} weeks`
}

export function NextUpCard({ event, openTasks }: Props) {
  if (!event) {
    return (
      <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-card px-6 py-8 text-center">
        <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700">Nothing scheduled</p>
        <p className="text-xs text-slate-400 mt-1">
          No interviews on the calendar. A good moment to chase the applications waiting on a reply.
        </p>
      </div>
    )
  }

  const days  = daysUntil(event.startAt)
  const soon  = days <= 3
  const label = countdownLabel(event.startAt)

  return (
    <div className="relative overflow-hidden bg-surface rounded-2xl border border-slate-200/80 shadow-card">
      {/* A quiet accent bar rather than a full color wash — the countdown carries
          the urgency, so the surface stays calm and the text stays readable. */}
      <div className={soon ? 'h-1 bg-primary-gradient' : 'h-1 bg-slate-200'} />

      <div className="px-6 py-5">
        <div className="flex items-start gap-4">
          <CompanyLogo name={event.companyName ?? ''} size="lg" />

          <div className="flex-1 min-w-0">
            <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Next up</p>
            <h2 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">
              {event.title}
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                <span className="force-ltr">{formatDate(event.startAt, 'EEEE, MMM d')} · {formatTime(event.startAt)}</span>
              </span>
              {event.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {event.location}
                </span>
              )}
              {event.companyName && (
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  {event.companyName}
                </span>
              )}
            </div>
          </div>

          <div className="text-end shrink-0">
            <p className={`text-2xl font-bold leading-none ${soon ? 'text-primary-600' : 'text-slate-700'}`}>
              {label}
            </p>
          </div>
        </div>

        {openTasks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Before then — {openTasks.length} open
            </p>
            <ul className="space-y-1.5">
              {openTasks.slice(0, 4).map(task => (
                <li key={task.id} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                  <span className="leading-snug">{task.title}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-primary-600 hover:underline"
            >
              All tasks <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
