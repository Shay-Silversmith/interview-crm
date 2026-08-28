import type { CalendarEvent } from '@/types'
import { mockStore } from '@/data/mock-store'
import { MOCK_DELAY_MS } from '@/lib/constants'
import { isSupabaseMode } from '@/lib/env'
import { getSupabaseClient } from '@/lib/supabase'
import { mapCalendarEvent } from '@/lib/mappers'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

const mockImpl = {
  async list(): Promise<CalendarEvent[]> { await delay(); return mockStore.events.list() },
  async getById(id: string): Promise<CalendarEvent | null> { await delay(); return mockStore.events.getById(id) },
  async getByDateRange(start: Date, end: Date): Promise<CalendarEvent[]> {
    await delay()
    return mockStore.events.list().filter(e => {
      const d = new Date(e.startAt); return d >= start && d <= end
    })
  },
  async getUpcoming(days = 7): Promise<CalendarEvent[]> {
    await delay()
    const now = new Date()
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    return mockStore.events.list()
      .filter(e => new Date(e.startAt) >= now && new Date(e.startAt) <= future)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  },
  async create(data: Partial<CalendarEvent>): Promise<CalendarEvent> { await delay(); return mockStore.events.create(data) },
  async update(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> { await delay(); return mockStore.events.update(id, data) },
  async delete(id: string): Promise<void> { await delay(); mockStore.events.delete(id) },
}

const supabaseImpl = {
  async list(): Promise<CalendarEvent[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('calendar_events').select('*').order('start_at')
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapCalendarEvent)
  },
  async getById(id: string): Promise<CalendarEvent | null> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('calendar_events').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data ? mapCalendarEvent(data) : null
  },
  async getByDateRange(start: Date, end: Date): Promise<CalendarEvent[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('calendar_events').select('*').gte('start_at', start.toISOString()).lte('start_at', end.toISOString()).order('start_at')
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapCalendarEvent)
  },
  async getUpcoming(days = 7): Promise<CalendarEvent[]> {
    const now = new Date()
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    return this.getByDateRange(now, future)
  },
  async create(data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const sb = getSupabaseClient()
    const row = {
      title: data.title,
      type: data.type ?? 'Interview',
      start_at: data.startAt,
      end_at: data.endAt,
      all_day: data.allDay ?? false,
      application_id: data.applicationId,
      contact_id: data.contactId,
      description: data.description,
      location: data.location,
      meeting_url: data.meetingUrl,
      reminder_minutes: data.reminderMinutes,
      company_name: data.companyName,
      application_name: data.applicationName,
    }
    const { data: inserted, error } = await sb.from('calendar_events').insert(row).select().single()
    if (error) throw new Error(error.message)
    return mapCalendarEvent(inserted)
  },
  async update(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const sb = getSupabaseClient()
    const row: Record<string, unknown> = {}
    if (data.title !== undefined) row.title = data.title
    if (data.type !== undefined) row.type = data.type
    if (data.startAt !== undefined) row.start_at = data.startAt
    if (data.endAt !== undefined) row.end_at = data.endAt
    if (data.allDay !== undefined) row.all_day = data.allDay
    if (data.description !== undefined) row.description = data.description
    if (data.location !== undefined) row.location = data.location
    if (data.meetingUrl !== undefined) row.meeting_url = data.meetingUrl
    const { data: updated, error } = await sb.from('calendar_events').update(row).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return mapCalendarEvent(updated)
  },
  async delete(id: string): Promise<void> {
    const sb = getSupabaseClient()
    const { error } = await sb.from('calendar_events').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

export const calendarService = isSupabaseMode() ? supabaseImpl : mockImpl
