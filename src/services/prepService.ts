import type { PreparedAnswer } from '@/types'
import type { PrepCategory } from '@/lib/enums'
import { mockStore } from '@/data/mock-store'
import { MOCK_DELAY_MS } from '@/lib/constants'
import { isSupabaseMode } from '@/lib/env'
import { getSupabaseClient } from '@/lib/supabase'
import { mapPreparedAnswer } from '@/lib/mappers'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

const mockImpl = {
  async list(): Promise<PreparedAnswer[]> { await delay(); return mockStore.prep.list() },
  async getById(id: string): Promise<PreparedAnswer | null> { await delay(); return mockStore.prep.getById(id) },
  async getByCategory(category: PrepCategory): Promise<PreparedAnswer[]> {
    await delay(); return mockStore.prep.list().filter(a => a.category === category)
  },
  async getByApplication(appId: string): Promise<PreparedAnswer[]> {
    await delay(); return mockStore.prep.list().filter(a => a.applicationIds?.includes(appId))
  },
  async create(data: Partial<PreparedAnswer>): Promise<PreparedAnswer> {
    await delay()
    const item = mockStore.prep.create({ ...data, lastUpdatedAt: new Date().toISOString() })
    return item
  },
  async update(id: string, data: Partial<PreparedAnswer>): Promise<PreparedAnswer> {
    await delay()
    return mockStore.prep.update(id, { ...data, lastUpdatedAt: new Date().toISOString() })
  },
  async delete(id: string): Promise<void> { await delay(); mockStore.prep.delete(id) },
}

const supabaseImpl = {
  async list(): Promise<PreparedAnswer[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('prepared_answers').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapPreparedAnswer)
  },
  async getById(id: string): Promise<PreparedAnswer | null> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('prepared_answers').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data ? mapPreparedAnswer(data) : null
  },
  async getByCategory(category: PrepCategory): Promise<PreparedAnswer[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('prepared_answers').select('*').eq('category', category).order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapPreparedAnswer)
  },
  async getByApplication(appId: string): Promise<PreparedAnswer[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('prepared_answers').select('*').eq('application_id', appId)
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapPreparedAnswer)
  },
  async create(data: Partial<PreparedAnswer>): Promise<PreparedAnswer> {
    const sb = getSupabaseClient()
    const { data: inserted, error } = await sb.from('prepared_answers').insert({
      question: data.question, category: data.category ?? 'Behavioral',
      answer: data.answer, confidence: data.confidence ?? 3,
      is_ready: data.isReady ?? false, tags: data.tags ?? [],
      application_id: data.applicationIds?.[0],
      last_updated_at: new Date().toISOString(),
    }).select().single()
    if (error) throw new Error(error.message)
    return mapPreparedAnswer(inserted)
  },
  async update(id: string, data: Partial<PreparedAnswer>): Promise<PreparedAnswer> {
    const sb = getSupabaseClient()
    const row: Record<string, unknown> = { last_updated_at: new Date().toISOString() }
    if (data.question !== undefined) row.question = data.question
    if (data.answer !== undefined) row.answer = data.answer
    if (data.confidence !== undefined) row.confidence = data.confidence
    if (data.isReady !== undefined) row.is_ready = data.isReady
    if (data.category !== undefined) row.category = data.category
    if (data.tags !== undefined) row.tags = data.tags
    const { data: updated, error } = await sb.from('prepared_answers').update(row).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return mapPreparedAnswer(updated)
  },
  async delete(id: string): Promise<void> {
    const sb = getSupabaseClient()
    const { error } = await sb.from('prepared_answers').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

export const prepService = isSupabaseMode() ? supabaseImpl : mockImpl
