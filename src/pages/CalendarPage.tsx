import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Plus, Edit2, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { EventTypeBadge } from '@/components/ui/Badge'
import { Drawer } from '@/components/ui/Drawer'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CalendarEventForm } from '@/components/forms/CalendarEventForm'
import { useMockStore } from '@/hooks/useMockStore'
import { useCalendarMutations } from '@/hooks/useCalendarMutations'
import { useI18n } from '@/hooks/useI18n'
import { calendarService } from '@/services/calendarService'
import { applicationsService } from '@/services/applicationsService'
import { tasksService } from '@/services/tasksService'
import { getCalendarDays, formatDate, formatDateTime, isSameMonth, isToday, parseISO } from '@/utils/date'
import { cn } from '@/lib/cn'
import { QK } from '@/lib/query-keys'
import type { CalendarEvent } from '@/types'
import type { CalendarEventType } from '@/lib/enums'
import type { CalendarEventFormValues } from '@/lib/schemas/calendarEventSchema'

/** Marks a CalendarEvent that was synthesized from a Task or InterviewStage —
 *  these are read-only and link back to the source. */
type VirtualSource =
  | { kind: 'task';  taskId: string }
  | { kind: 'round'; applicationId: string; stageId: string }

interface SyntheticEvent extends CalendarEvent {
  _virtual?: VirtualSource
}

// Solid fills, used only for the small legend/list dots where the colour is
// decorative and carries no text.
const EVENT_TYPE_BG: Record<CalendarEventType, string> = {
  Interview: 'bg-violet-500',
  'Assignment Deadline': 'bg-danger-500',
  'Application Deadline': 'bg-warning-500',
  'Follow-up Reminder': 'bg-primary-400',
  'Preparation Session': 'bg-success-400',
  'General Task': 'bg-slate-400',
}

// Chips inside day cells carry a title, so they cannot use the solid fills:
// white on amber-500 or emerald-400 lands around 2:1. A tinted background with
// a same-hue dark label and a solid accent rail keeps the colour coding while
// the text stays readable — and inverts correctly with the theme tokens.
const EVENT_TYPE_CHIP: Record<CalendarEventType, string> = {
  Interview:              'bg-violet-100  text-violet-700  border-violet-500',
  'Assignment Deadline':  'bg-danger-100  text-danger-700  border-danger-500',
  'Application Deadline': 'bg-warning-100 text-warning-800 border-warning-500',
  'Follow-up Reminder':   'bg-primary-100 text-primary-700 border-primary-500',
  'Preparation Session':  'bg-success-100 text-success-700 border-success-500',
  'General Task':         'bg-slate-150   text-slate-700   border-slate-400',
}

// Sunday-first keys matching the dictionary
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

export function CalendarPage() {
  const { t } = useI18n()
  const { data: events } = useMockStore(() => calendarService.list(), [], { key: QK.calendar.all() })
  const { data: apps }   = useMockStore(() => applicationsService.list(), [], { key: QK.applications.all() })
  const { data: tasks }  = useMockStore(() => tasksService.list(), [], { key: QK.tasks.all() })
  const { create, update, remove } = useCalendarMutations()

  // Combine real events + synthesized events from tasks (with dueAt) and
  // interview rounds (with scheduledAt). Virtual events show in the grid but
  // can't be edited/deleted from here — the source lives elsewhere.
  const allEvents: SyntheticEvent[] = useMemo(() => {
    const real = (events ?? []) as SyntheticEvent[]

    const fromTasks: SyntheticEvent[] = (tasks ?? [])
      .filter(t => !!t.dueAt && t.status !== 'Done' && t.status !== 'Cancelled')
      .map(t => ({
        id:          `task:${t.id}`,
        title:       t.title,
        type:        (t.category === 'Assignment' ? 'Assignment Deadline' : 'General Task') as CalendarEventType,
        startAt:     t.dueAt!,
        applicationId: t.applicationId,
        companyName:   t.companyName,
        description:   t.description,
        createdAt:     t.createdAt,
        updatedAt:     t.updatedAt,
        _virtual:      { kind: 'task', taskId: t.id },
      }))

    const fromRounds: SyntheticEvent[] = (apps ?? []).flatMap(app =>
      (app.interviewStages ?? [])
        .filter(s => !!s.scheduledAt)
        .map(s => ({
          id:          `round:${s.id}`,
          title:       `${app.companyName} — ${s.type}`,
          type:        'Interview' as CalendarEventType,
          startAt:     s.scheduledAt!,
          applicationId: app.id,
          companyName:   app.companyName,
          description:   s.notes,
          location:      s.interviewer,
          createdAt:     new Date().toISOString(),
          updatedAt:     new Date().toISOString(),
          _virtual:      { kind: 'round', applicationId: app.id, stageId: s.id },
        }))
    )

    // De-dupe: if a real event was created with the same id-suffix, prefer real.
    const realIds = new Set(real.map(e => e.id))
    const merged = [
      ...real,
      ...fromTasks.filter(e => !realIds.has(e.id)),
      ...fromRounds.filter(e => !realIds.has(e.id)),
    ]
    return merged
  }, [events, tasks, apps])

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedEvent, setSelectedEvent] = useState<SyntheticEvent | null>(null)

  // Drag-to-reschedule. Only real events move: the synthetic ones are
  // projections of a Task or an interview round and have to be edited at
  // their source, so they are never made draggable.
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null)

  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteEvent, setDeleteEvent] = useState<CalendarEvent | null>(null)

  const handleDropOnDay = (ev: React.DragEvent, day: Date, dayKey: string) => {
    setDropTargetKey(null)
    setDraggingId(null)
    // The id travels in the drag payload rather than in React state: state set
    // during dragstart is not guaranteed to have been committed by the time
    // drop fires, and dataTransfer is what the drag lifecycle is built on.
    const id = ev.dataTransfer.getData('text/plain')
    if (!id) return

    const event = allEvents.find(x => x.id === id)
    if (!event || event._virtual || !event.startAt) return
    if (formatDate(parseISO(event.startAt), 'yyyy-MM-dd') === dayKey) return // no-op

    // Move the calendar date, keep the time of day the user already set.
    const original = parseISO(event.startAt)
    const moved = new Date(day)
    moved.setHours(original.getHours(), original.getMinutes(), 0, 0)

    update.mutate({ id, data: { startAt: moved.toISOString() } })
  }

  const days = useMemo(() => getCalendarDays(year, month), [year, month])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, SyntheticEvent[]>()
    allEvents.forEach(e => {
      if (!e.startAt) return
      try {
        const d = parseISO(e.startAt)
        if (Number.isNaN(d.getTime())) return
        const key = formatDate(d, 'yyyy-MM-dd')
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(e)
      } catch { /* skip unparseable */ }
    })
    return map
  }, [allEvents])

  const agendaEvents = useMemo(() => {
    return [...allEvents].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  }, [allEvents])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const handleCreate = async (values: CalendarEventFormValues) => {
    const appName = apps?.find(a => a.id === values.applicationId)?.companyName
    await create.mutateAsync({
      title:         values.title,
      type:          values.type,
      startAt:       values.startAt ? new Date(values.startAt).toISOString() : new Date().toISOString(),
      endAt:         values.endAt   ? new Date(values.endAt).toISOString()   : undefined,
      allDay:        values.allDay,
      applicationId: values.applicationId || undefined,
      companyName:   appName,
      description:   values.description || undefined,
      location:      values.location || undefined,
      meetingUrl:    values.meetingUrl || undefined,
      reminderMinutes: values.reminderMinutes,
    })
    setAddOpen(false)
  }

  const handleEdit = async (values: CalendarEventFormValues) => {
    if (!editEvent) return
    await update.mutateAsync({
      id: editEvent.id,
      data: {
        title:         values.title,
        type:          values.type,
        startAt:       values.startAt ? new Date(values.startAt).toISOString() : editEvent.startAt,
        endAt:         values.endAt   ? new Date(values.endAt).toISOString()   : undefined,
        allDay:        values.allDay,
        description:   values.description || undefined,
        location:      values.location || undefined,
        meetingUrl:    values.meetingUrl || undefined,
        reminderMinutes: values.reminderMinutes,
      },
    })
    setEditEvent(null)
    setSelectedEvent(null)
  }

  const handleDelete = async () => {
    if (!deleteEvent) return
    await remove.mutateAsync(deleteEvent.id)
    setDeleteEvent(null)
    setSelectedEvent(null)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={t('pages.calendar.title')}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            {t('pages.calendar.newEvent')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Month grid */}
        <div className="xl:col-span-2">
          <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 force-ltr">
                {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" iconOnly onClick={prevMonth} aria-label="Previous month">
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()) }}>
                  {t('pages.calendar.today')}
                </Button>
                <Button variant="ghost" size="sm" iconOnly onClick={nextMonth} aria-label="Next month">
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-surface-sunken/60">
              {DAY_KEYS.map((key, i) => (
                <div
                  key={key}
                  className={cn(
                    'py-2.5 text-center text-2xs sm:text-xs font-semibold uppercase tracking-wider',
                    // Weekends read one step quieter so the working week stands out.
                    i === 0 || i === 6 ? 'text-slate-400' : 'text-slate-500',
                  )}
                >
                  {/* Full name where there is room, first letter on narrow screens. */}
                  <span className="hidden sm:inline">{t(`pages.calendar.days.${key}`)}</span>
                  <span className="sm:hidden">{t(`pages.calendar.days.${key}`).charAt(0)}</span>
                </div>
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
                    onDragOver={e => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      setDropTargetKey(key)
                    }}
                    onDragLeave={() => setDropTargetKey(c => (c === key ? null : c))}
                    onDrop={e => handleDropOnDay(e, day, key)}
                    className={cn(
                      'group/day min-h-[92px] sm:min-h-[112px] p-1.5 border-e border-b border-slate-200/70 transition-colors',
                      (i + 1) % 7 === 0 && 'border-e-0',
                      !isCurrentMonth && 'bg-surface-sunken/50',
                      // Only highlight while a card is actually over this cell.
                      dropTargetKey === key
                        ? 'bg-primary-100/70 ring-1 ring-inset ring-primary-400'
                        : 'hover:bg-slate-50',
                    )}
                  >
                    <div className={cn(
                      'w-6 h-6 flex items-center justify-center rounded-full text-xs mb-1.5 transition-colors',
                      today
                        ? 'bg-primary-gradient text-white font-bold shadow-sm'
                        : isCurrentMonth
                          ? 'font-medium text-slate-700'
                          : 'font-medium text-slate-400',
                    )}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(e => {
                        const movable = !e._virtual
                        return (
                          <button
                            key={e.id}
                            draggable={movable}
                            onDragStart={ev => {
                              if (!movable) return
                              ev.dataTransfer.setData('text/plain', e.id)
                              ev.dataTransfer.effectAllowed = 'move'
                              setDraggingId(e.id)
                            }}
                            onDragEnd={() => { setDraggingId(null); setDropTargetKey(null) }}
                            onClick={() => setSelectedEvent(e)}
                            title={e.title}
                            className={cn(
                              'w-full flex text-start text-2xs font-medium px-1.5 py-1 rounded-md truncate',
                              'border-s-2 transition-all duration-150 hover:brightness-95',
                              EVENT_TYPE_CHIP[e.type],
                              movable && 'cursor-grab active:cursor-grabbing',
                              draggingId === e.id && 'opacity-40',
                            )}
                          >
                            <span className="truncate">{e.title}</span>
                          </button>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <p className="text-2xs font-medium text-slate-500 px-1.5">
                          +{dayEvents.length - 3} more
                        </p>
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
          <h3 className="text-sm font-semibold text-slate-600 mb-3">{t('pages.calendar.allEvents')}</h3>
          {agendaEvents.length === 0 ? (
            <EmptyState icon={Calendar} title={t('pages.calendar.noEvents')} description={t('pages.calendar.noEventsSub')} />
          ) : (
            <div className="space-y-2">
              {agendaEvents.map(event => {
                const isPast = new Date(event.startAt) < new Date()
                return (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={cn(
                      'w-full text-start bg-surface rounded-xl border border-slate-200 shadow-card p-3 hover:shadow-card-hover transition-all',
                      isPast && 'opacity-60'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', EVENT_TYPE_BG[event.type])} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 leading-snug">{event.title}</p>
                        <p className="text-2xs text-slate-400 mt-0.5 force-ltr">{formatDate(event.startAt, 'EEE, MMM d · h:mm a')}</p>
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

      {/* Event detail drawer */}
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
              <InfoRow label="Date & Time" value={formatDateTime(selectedEvent.startAt)} ltr />
              {selectedEvent.endAt && <InfoRow label="End Time" value={formatDateTime(selectedEvent.endAt)} ltr />}
              {selectedEvent.companyName && <InfoRow label="Company" value={selectedEvent.companyName} />}
              {selectedEvent.location && <InfoRow label="Location" value={selectedEvent.location} />}
              {selectedEvent.meetingUrl && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Meeting Link</p>
                  <a href={selectedEvent.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline break-all force-ltr">
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
            {selectedEvent._virtual ? (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
                {selectedEvent._virtual.kind === 'task'
                  ? <>This event is auto-generated from a <span className="font-semibold">Task</span>. Edit it on the Tasks page.</>
                  : <>This event is auto-generated from an <span className="font-semibold">Interview round</span>. Edit it inside the application.</>}
              </div>
            ) : (
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => { setEditEvent(selectedEvent); setSelectedEvent(null) }}>
                  <Edit2 className="w-3.5 h-3.5" /> {t('common.edit')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setDeleteEvent(selectedEvent); setSelectedEvent(null) }} className="text-danger-600 hover:bg-danger-50">
                  <Trash2 className="w-3.5 h-3.5" /> {t('common.delete')}
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t('pages.calendar.newEvent')}>
        <CalendarEventForm
          applications={apps ?? []}
          onSubmit={handleCreate}
          onCancel={() => setAddOpen(false)}
          loading={create.isPending}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editEvent} onClose={() => setEditEvent(null)} title={t('common.edit')}>
        {editEvent && (
          <CalendarEventForm
            initial={editEvent}
            applications={apps ?? []}
            onSubmit={handleEdit}
            onCancel={() => setEditEvent(null)}
            loading={update.isPending}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteEvent}
        onClose={() => setDeleteEvent(null)}
        onConfirm={handleDelete}
        title={t('common.delete') + '?'}
        description={`Remove "${deleteEvent?.title}"? This cannot be undone.`}
        confirmLabel={t('common.delete')}
        loading={remove.isPending}
      />
    </div>
  )
}

function InfoRow({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={cn('text-sm text-slate-700', ltr && 'force-ltr')}>{value}</p>
    </div>
  )
}
