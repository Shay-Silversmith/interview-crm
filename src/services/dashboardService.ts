import type { JobApplication, Task, CalendarEvent, RecentActivity } from '@/types'
import { mockStore } from '@/data/mock-store'
import { MOCK_DELAY_MS } from '@/lib/constants'
import { isSupabaseMode } from '@/lib/env'
import { getSupabaseClient } from '@/lib/supabase'
import { mapApplication, mapTask, mapCalendarEvent, mapRecentActivity } from '@/lib/mappers'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

export interface DashboardData {
  todayInterviews: CalendarEvent[]
  overdueTasks: Task[]
  topApplications: JobApplication[]
  upcomingDeadlines: CalendarEvent[]
  recentActivity: RecentActivity[]
}

const mockImpl = {
  async getDashboardData(): Promise<DashboardData> {
    await delay()
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd   = new Date(todayStart.getTime() + 86_400_000)
    const in7Days    = new Date(now.getTime() + 7 * 86_400_000)

    const allEvents = mockStore.events.list()
    const todayInterviews = allEvents
      .filter(e => { const d = new Date(e.startAt); return e.type === 'Interview' && d >= todayStart && d < todayEnd })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

    const overdueTasks = mockStore.tasks.list()
      .filter(t => t.status !== 'Done' && t.status !== 'Cancelled' && t.dueAt && new Date(t.dueAt) < now)
      .sort((a, b) => ({ Critical: 0, High: 1, Medium: 2, Low: 3 }[a.priority] - { Critical: 0, High: 1, Medium: 2, Low: 3 }[b.priority]))

    const topApplications = mockStore.applications.list()
      .filter(a => a.stage !== 'Rejected' && a.stage !== 'Withdrawn')
      .sort((a, b) => (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0))
      .slice(0, 4)

    const upcomingDeadlines = allEvents
      .filter(e => { const d = new Date(e.startAt); return d >= now && d <= in7Days })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

    const recentActivity = mockStore.activity.list()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)

    return { todayInterviews, overdueTasks, topApplications, upcomingDeadlines, recentActivity }
  },
}

const supabaseImpl = {
  async getDashboardData(): Promise<DashboardData> {
    const sb = getSupabaseClient()
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd   = new Date(todayStart.getTime() + 86_400_000)
    const in7Days    = new Date(now.getTime() + 7 * 86_400_000)

    const [evRes, taskRes, appRes, actRes] = await Promise.all([
      sb.from('calendar_events').select('*').gte('starts_at', now.toISOString()).lte('starts_at', in7Days.toISOString()).order('starts_at'),
      sb.from('tasks').select('*').neq('status', 'Done').neq('status', 'Cancelled').lt('due_at', now.toISOString()).order('due_at'),
      sb.from('job_applications').select('*').not('stage', 'in', '("Rejected","Withdrawn")').order('urgency_score', { ascending: false }).limit(4),
      sb.from('recent_activity').select('*').order('created_at', { ascending: false }).limit(8),
    ])
    if (evRes.error)   throw new Error(evRes.error.message)
    if (taskRes.error) throw new Error(taskRes.error.message)
    if (appRes.error)  throw new Error(appRes.error.message)
    if (actRes.error)  throw new Error(actRes.error.message)

    const allEvents = (evRes.data ?? []).map(mapCalendarEvent)
    return {
      todayInterviews:    allEvents.filter(e => { const d = new Date(e.startAt); return e.type === 'Interview' && d >= todayStart && d < todayEnd }),
      overdueTasks:       (taskRes.data ?? []).map(mapTask),
      topApplications:    (appRes.data ?? []).map(mapApplication),
      upcomingDeadlines:  allEvents,
      recentActivity:     (actRes.data ?? []).map(mapRecentActivity),
    }
  },
}

export const dashboardService = isSupabaseMode() ? supabaseImpl : mockImpl
