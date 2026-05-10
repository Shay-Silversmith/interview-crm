import type { Task } from '@/types'
import { mockStore } from '@/data/mock-store'
import { MOCK_DELAY_MS } from '@/lib/constants'
import { isSupabaseMode } from '@/lib/env'
import { getSupabaseClient } from '@/lib/supabase'
import { mapTask } from '@/lib/mappers'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

const mockImpl = {
  async list(): Promise<Task[]> { await delay(); return mockStore.tasks.list() },
  async getById(id: string): Promise<Task | null> { await delay(); return mockStore.tasks.getById(id) },
  async getByApplication(appId: string): Promise<Task[]> {
    await delay(); return mockStore.tasks.list().filter(t => t.applicationId === appId)
  },
  async create(data: Partial<Task>): Promise<Task> { await delay(); return mockStore.tasks.create(data) },
  async update(id: string, data: Partial<Task>): Promise<Task> { await delay(); return mockStore.tasks.update(id, data) },
  async delete(id: string): Promise<void> { await delay(); mockStore.tasks.delete(id) },
}

const supabaseImpl = {
  async list(): Promise<Task[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('tasks').select('*').order('due_at', { ascending: true, nullsFirst: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapTask)
  },
  async getById(id: string): Promise<Task | null> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('tasks').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data ? mapTask(data) : null
  },
  async getByApplication(appId: string): Promise<Task[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('tasks').select('*').eq('application_id', appId).order('due_at', { ascending: true, nullsFirst: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapTask)
  },
  async create(data: Partial<Task>): Promise<Task> {
    const sb = getSupabaseClient()
    const row = {
      title: data.title,
      description: data.description,
      category: data.category ?? 'Preparation',
      status: data.status ?? 'Todo',
      priority: data.priority ?? 'Medium',
      due_at: data.dueAt,
      application_id: data.applicationId,
      company_name: data.companyName,
    }
    const { data: inserted, error } = await sb.from('tasks').insert(row).select().single()
    if (error) throw new Error(error.message)
    return mapTask(inserted)
  },
  async update(id: string, data: Partial<Task>): Promise<Task> {
    const sb = getSupabaseClient()
    const row: Record<string, unknown> = {}
    if (data.title !== undefined) row.title = data.title
    if (data.description !== undefined) row.description = data.description
    if (data.category !== undefined) row.category = data.category
    if (data.status !== undefined) row.status = data.status
    if (data.priority !== undefined) row.priority = data.priority
    if (data.dueAt !== undefined) row.due_at = data.dueAt
    if (data.completedAt !== undefined) row.completed_at = data.completedAt
    const { data: updated, error } = await sb.from('tasks').update(row).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return mapTask(updated)
  },
  async delete(id: string): Promise<void> {
    const sb = getSupabaseClient()
    const { error } = await sb.from('tasks').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

export const tasksService = isSupabaseMode() ? supabaseImpl : mockImpl
