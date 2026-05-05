import type { JobApplication, Task, CalendarEvent, RecentActivity } from '@/types'
import { mockApplications } from '@/data/mock-applications'
import { mockTasks } from '@/data/mock-tasks'
import { mockCalendarEvents } from '@/data/mock-calendar'
import { mockRecentActivity } from '@/data/mock-activity'
import { MOCK_DELAY_MS } from '@/lib/constants'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

export interface DashboardData {
  todayInterviews: CalendarEvent[]
  overdueTasks: Task[]
  topApplications: JobApplication[]
  upcomingDeadlines: CalendarEvent[]
  recentActivity: RecentActivity[]
}

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    await delay()
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const todayInterviews = mockCalendarEvents
      .filter(e => {
        const d = new Date(e.startAt)
        return e.type === 'Interview' && d >= todayStart && d < todayEnd
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

    const overdueTasks = mockTasks
      .filter(t => t.status !== 'Done' && t.status !== 'Cancelled' && t.dueAt && new Date(t.dueAt) < now)
      .sort((a, b) => {
        const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

    const topApplications = [...mockApplications]
      .filter(a => a.stage !== 'Rejected' && a.stage !== 'Withdrawn')
      .sort((a, b) => (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0))
      .slice(0, 4)

    const upcomingDeadlines = mockCalendarEvents
      .filter(e => {
        const d = new Date(e.startAt)
        return d >= now && d <= in7Days
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

    const recentActivity = [...mockRecentActivity]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)

    return { todayInterviews, overdueTasks, topApplications, upcomingDeadlines, recentActivity }
  },
}
