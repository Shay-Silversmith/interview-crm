import type { Contact } from '@/types'
import { mockStore } from '@/data/mock-store'
import { MOCK_DELAY_MS } from '@/lib/constants'
import { isSupabaseMode } from '@/lib/env'
import { getSupabaseClient } from '@/lib/supabase'
import { mapContact } from '@/lib/mappers'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

const mockImpl = {
  async list(): Promise<Contact[]> { await delay(); return mockStore.contacts.list() },
  async getById(id: string): Promise<Contact | null> { await delay(); return mockStore.contacts.getById(id) },
  async getByApplication(appId: string): Promise<Contact[]> {
    await delay(); return mockStore.contacts.list().filter(c => c.applicationIds.includes(appId))
  },
  async getByCompany(companyId: string): Promise<Contact[]> {
    await delay(); return mockStore.contacts.list().filter(c => c.companyId === companyId)
  },
  async create(data: Partial<Contact>): Promise<Contact> { await delay(); return mockStore.contacts.create(data) },
  async update(id: string, data: Partial<Contact>): Promise<Contact> { await delay(); return mockStore.contacts.update(id, data) },
  async delete(id: string): Promise<void> { await delay(); mockStore.contacts.delete(id) },
}

const supabaseImpl = {
  async list(): Promise<Contact[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('contacts').select('*').order('name')
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapContact)
  },
  async getById(id: string): Promise<Contact | null> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('contacts').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data ? mapContact(data) : null
  },
  async getByApplication(appId: string): Promise<Contact[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('contacts').select('*').eq('application_id', appId)
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapContact)
  },
  async getByCompany(companyId: string): Promise<Contact[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('contacts').select('*').eq('company_id', companyId)
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapContact)
  },
  async create(data: Partial<Contact>): Promise<Contact> {
    const sb = getSupabaseClient()
    const row = {
      name: data.name,
      type: data.type ?? 'Recruiter',
      company_name: data.company,
      company_id: data.companyId,
      title: data.title,
      email: data.email,
      linkedin_url: data.linkedinUrl,
      notes: data.notes,
      application_id: data.applicationIds?.[0],
    }
    const { data: inserted, error } = await sb.from('contacts').insert(row).select().single()
    if (error) throw new Error(error.message)
    return mapContact(inserted)
  },
  async update(id: string, data: Partial<Contact>): Promise<Contact> {
    const sb = getSupabaseClient()
    const row: Record<string, unknown> = {}
    if (data.name !== undefined) row.name = data.name
    if (data.type !== undefined) row.type = data.type
    if (data.company !== undefined) row.company_name = data.company
    if (data.title !== undefined) row.title = data.title
    if (data.email !== undefined) row.email = data.email
    if (data.linkedinUrl !== undefined) row.linkedin_url = data.linkedinUrl
    if (data.notes !== undefined) row.notes = data.notes
    if (data.lastInteractionAt !== undefined) row.last_interaction_at = data.lastInteractionAt
    if (data.followUpDueAt !== undefined) row.follow_up_due_at = data.followUpDueAt
    const { data: updated, error } = await sb.from('contacts').update(row).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return mapContact(updated)
  },
  async delete(id: string): Promise<void> {
    const sb = getSupabaseClient()
    const { error } = await sb.from('contacts').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

export const contactsService = isSupabaseMode() ? supabaseImpl : mockImpl
