import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { EventTypeBadge } from '@/components/ui/Badge'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { useMockStore } from '@/hooks/useMockStore'
import { calendarService } from '@/services/calendarService'
import { getCalendarDays, formatDate, formatDateTime, isSameDay, isSameMonth, isToday, parseISO } from '@/utils/date'
import { cn } from '@/lib/cn'
import type { CalendarEvent } from '@/types'
import type { CalendarEventType } from '@/lib/enums'

const EVENT_TYPE_BG: Record<CalendarEventType, string> = {
  Interview: 'bg-violet-500',
  'Assignment Deadline': 'bg-danger-500',
  'Application Deadline': 'bg-warning-500',
  'Follow-up Reminder': 'bg-primary-400',
  'Preparation Session': 'bg-success-400',
  'General Task': 'bg-slate-400',
}

export function CalendarPage() {
  const { data: events } = useMockStore(() => calendarService.list())
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const days = useMemo(() => getCalendarDays(year, month), [year, month])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    events?.forEach(e => {
      const key = formatDate(parseISO(e.startAt), 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    })
    return map
  }, [events])

  const agendaEvents = useMemo(() => {
    return [...(events ?? [])].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  }, [events])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Calendar" description="Interviews, deadlines, and reminders" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Month grid */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">
                {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" iconOnly onClick={prevMonth} aria-label="Previous month">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()) }}>
                  Today
                </Button>
                <Button variant="ghost" size="sm" iconOnly onClick={nextMonth} aria-label="Next month">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const key = formatDate(day, 'yyyy-MM-dd')
                const dayEvents = eventsByDay.get(key) ?? []
                const isCurrentMonth = isSameMonth(day, new Date(year, month))
                const today = isToday(day)
                return (
                  <div
                    key={i}
                    className={cn(
                      'min-h-[80px] p-1.5 border-r border-b border-slate-50',
                      !isCurrentMonth && 'bg-slate-50/50',
                      (i + 1) % 7 === 0 && 'border-r-0'
                    )}
                  >
                    <div className={cn(
                      'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1',
                      today ? 'bg-primary-600 text-white' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
                    )}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(e => (
                        <button
                          key={e.id}
                          onClick={() => setSelectedEvent(e)}
                          className={cn(
                            'w-full text-left text-2xs text-white px-1.5 py-0.5 rounded-md truncate',
                            EVENT_TYPE_BG[e.type]
                          )}
                        >
                          {e.title}
                        </button>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-2xs text-slate-400 px-1">+{dayEvents.length - 2} more</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Agenda */}
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-3">All Events</h3>
          {agendaEvents.length === 0 ? (
            <EmptyState icon={Calendar} title="No events" description="Events from your applications appear here." />
          ) : (
            <div className="space-y-2">
              {agendaEvents.map(event => {
                const isPast = new Date(event.startAt) < new Date()
                return (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={cn(
                      'w-full text-left bg-white rounded-xl border border-slate-200 shadow-card p-3 hover:shadow-card-hover transition-all',
                      isPast && 'opacity-60'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', EVENT_TYPE_BG[event.type])} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 leading-snug">{event.title}</p>
                        <p className="text-2xs text-slate-400 mt-0.5">{formatDate(event.startAt, 'EEE, MMM d · h:mm a')}</p>
                        {event.companyName && (
                          <p className="text-2xs text-slate-400">{event.companyName}</p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Event drawer */}
      <Drawer
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title}
        width="sm"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <EventTypeBadge type={selectedEvent.type} />
            <div className="space-y-2">
              <InfoRow label="Date & Time" value={formatDateTime(selectedEvent.startAt)} />
              {selectedEvent.endAt && <InfoRow label="End Time" value={formatDateTime(selectedEvent.endAt)} />}
              {selectedEvent.companyName && <InfoRow label="Company" value={selectedEvent.companyName} />}
              {selectedEvent.location && <InfoRow label="Location" value={selectedEvent.location} />}
              {selectedEvent.meetingUrl && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Meeting Link</p>
                  <a href={selectedEvent.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline break-all">
                    {selectedEvent.meetingUrl}
                  </a>
                </div>
              )}
            </div>
            {selectedEvent.description && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedEvent.description}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
  )
}
