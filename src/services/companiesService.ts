import type { Company } from '@/types'
import { mockStore } from '@/data/mock-store'
import { MOCK_DELAY_MS } from '@/lib/constants'
import { isSupabaseMode } from '@/lib/env'
import { getSupabaseClient } from '@/lib/supabase'
import { mapCompany } from '@/lib/mappers'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

const mockImpl = {
  async list(): Promise<Company[]> { await delay(); return mockStore.companies.list() },
  async getById(id: string): Promise<Company | null> { await delay(); return mockStore.companies.getById(id) },
  async create(data: Partial<Company>): Promise<Company> { await delay(); return mockStore.companies.create(data) },
  async update(id: string, data: Partial<Company>): Promise<Company> { await delay(); return mockStore.companies.update(id, data) },
  async delete(id: string): Promise<void> { await delay(); mockStore.companies.delete(id) },
}

const supabaseImpl = {
  async list(): Promise<Company[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('companies').select('*').order('name')
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapCompany)
  },
  async getById(id: string): Promise<Company | null> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('companies').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data ? mapCompany(data) : null
  },
  async create(data: Partial<Company>): Promise<Company> {
    const sb = getSupabaseClient()
    const row = {
      name: data.name,
      industry: data.industry,
      size: data.size,
      location: data.location,
      website: data.website,
      linkedin_url: data.linkedinUrl,
      description: data.description,
      notes: data.notes,
      glassdoor_rating: data.glassdoorRating,
      tech_stack: data.techStack ?? [],
      logo_url: data.logoUrl,
    }
    const { data: inserted, error } = await sb.from('companies').insert(row).select().single()
    if (error) throw new Error(error.message)
    return mapCompany(inserted)
  },
  async update(id: string, data: Partial<Company>): Promise<Company> {
    const sb = getSupabaseClient()
    const row: Record<string, unknown> = {}
    if (data.name !== undefined) row.name = data.name
    if (data.industry !== undefined) row.industry = data.industry
    if (data.size !== undefined) row.size = data.size
    if (data.location !== undefined) row.location = data.location
    if (data.website !== undefined) row.website = data.website
    if (data.linkedinUrl !== undefined) row.linkedin_url = data.linkedinUrl
    if (data.description !== undefined) row.description = data.description
    if (data.notes !== undefined) row.notes = data.notes
    if (data.glassdoorRating !== undefined) row.glassdoor_rating = data.glassdoorRating
    if (data.techStack !== undefined) row.tech_stack = data.techStack
    if (data.logoUrl  !== undefined) row.logo_url   = data.logoUrl || null
    const { data: updated, error } = await sb.from('companies').update(row).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return mapCompany(updated)
  },
  async delete(id: string): Promise<void> {
    const sb = getSupabaseClient()
    const { error } = await sb.from('companies').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

export const companiesService = isSupabaseMode() ? supabaseImpl : mockImpl
