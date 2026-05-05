import type { CalendarEvent } from '@/types'
import { mockCalendarEvents } from '@/data/mock-calendar'
import { MOCK_DELAY_MS } from '@/lib/constants'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

export const calendarService = {
  async list(): Promise<CalendarEvent[]> {
    await delay()
    return [...mockCalendarEvents]
  },

  async getById(id: string): Promise<CalendarEvent | null> {
    await delay()
    return mockCalendarEvents.find(e => e.id === id) ?? null
  },

  async getByDateRange(start: Date, end: Date): Promise<CalendarEvent[]> {
    await delay()
    return mockCalendarEvents.filter(e => {
      const eventDate = new Date(e.startAt)
      return eventDate >= start && eventDate <= end
    })
  },

  async getUpcoming(days = 7): Promise<CalendarEvent[]> {
    await delay()
    const now = new Date()
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    return mockCalendarEvents
      .filter(e => new Date(e.startAt) >= now && new Date(e.startAt) <= future)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  },

  async create(_data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    await delay()
    throw new Error('Create not implemented — coming in Phase 5')
  },

  async update(_id: string, _data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    await delay()
    throw new Error('Update not implemented — coming in Phase 5')
  },

  async delete(_id: string): Promise<void> {
    await delay()
    throw new Error('Delete not implemented — coming in Phase 5')
  },
}
