import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isPast,
  parseISO,
  differenceInDays,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
} from 'date-fns'

/** Returns null if input is missing or unparseable. */
function safeParse(date: string | Date | undefined | null): Date | null {
  if (!date) return null
  const d = typeof date === 'string' ? parseISO(date) : date
  if (Number.isNaN(d.getTime())) return null
  return d
}

export function formatDate(date: string | Date | undefined | null, fmt = 'MMM d, yyyy'): string {
  const d = safeParse(date)
  return d ? format(d, fmt) : '—'
}

export function formatDateTime(date: string | Date | undefined | null): string {
  const d = safeParse(date)
  return d ? format(d, 'MMM d, yyyy · h:mm a') : '—'
}

export function formatTime(date: string | Date | undefined | null): string {
  const d = safeParse(date)
  return d ? format(d, 'h:mm a') : '—'
}

export function formatRelative(date: string | Date | undefined | null): string {
  const d = safeParse(date)
  if (!d) return '—'
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return formatDistanceToNow(d, { addSuffix: true })
}

export function isOverdue(date: string | Date | undefined | null): boolean {
  const d = safeParse(date)
  if (!d) return false
  return isPast(d) && !isToday(d)
}

export function daysUntil(date: string | Date | undefined | null): number {
  const d = safeParse(date)
  if (!d) return Number.POSITIVE_INFINITY
  return differenceInDays(d, new Date())
}

export function getCalendarDays(year: number, month: number): Date[] {
  const monthStart = startOfMonth(new Date(year, month))
  const monthEnd = endOfMonth(monthStart)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  return eachDayOfInterval({ start: calStart, end: calEnd })
}

export { isToday, isSameMonth, isSameDay, isWithinInterval, parseISO, format }
