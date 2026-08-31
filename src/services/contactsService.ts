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
    const { data, error } = await sb.from('contacts').select('*').contains('application_ids', [appId])
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
      company: data.company,
      company_id: data.companyId,
      title: data.title,
      email: data.email,
      phone: data.phone,
      linkedin_url: data.linkedinUrl,
      notes: data.notes,
      application_ids: data.applicationIds ?? [],
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
    if (data.company !== undefined) row.company = data.company
    if (data.companyId !== undefined) row.company_id = data.companyId
    if (data.phone !== undefined) row.phone = data.phone
    if (data.applicationIds !== undefined) row.application_ids = data.applicationIds
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

const impl = isSupabaseMode() ? supabaseImpl : mockImpl

// ---------------------------------------------------------------------------
// Application ↔ contact linkage
//
// Contacts are saved against a company; the link to a specific application is a
// second, manual step that almost nobody takes. getByApplication matches only
// on application_ids, so an application showed "no contacts" while three people
// from that exact company sat in the contacts list. Resolving by company as
// well is what the user already believes is happening.
//
// The two kinds are kept distinguishable rather than merged: an explicit link
// is a statement about this application, and a company match is an inference.
// ---------------------------------------------------------------------------

export interface ApplicationContact {
  contact: Contact
  /** True when application_ids names this application; false when matched by company. */
  linked:  boolean
}

async function getForApplication(
  appId: string,
  companyId?: string,
  companyName?: string,
): Promise<ApplicationContact[]> {
  const all = await impl.list()
  const name = companyName?.trim().toLowerCase()

  const result: ApplicationContact[] = []
  for (const contact of all) {
    const linked = contact.applicationIds?.includes(appId) ?? false
    const sameCompany =
      (!!companyId && contact.companyId === companyId) ||
      (!!name && contact.company?.trim().toLowerCase() === name)

    if (linked || sameCompany) result.push({ contact, linked })
  }

  // Explicit links first, then alphabetical, so the deliberate ones lead.
  return result.sort((a, b) =>
    a.linked === b.linked
      ? a.contact.name.localeCompare(b.contact.name)
      : a.linked ? -1 : 1,
  )
}

/** Adds this application to the contact's application_ids, idempotently. */
async function linkToApplication(contactId: string, appId: string): Promise<Contact> {
  const contact = await impl.getById(contactId)
  if (!contact) throw new Error('That contact no longer exists.')

  const current = contact.applicationIds ?? []
  if (current.includes(appId)) return contact
  return impl.update(contactId, { applicationIds: [...current, appId] })
}

/** Removes the link without touching the contact itself. */
async function unlinkFromApplication(contactId: string, appId: string): Promise<Contact> {
  const contact = await impl.getById(contactId)
  if (!contact) throw new Error('That contact no longer exists.')

  const current = contact.applicationIds ?? []
  if (!current.includes(appId)) return contact
  return impl.update(contactId, { applicationIds: current.filter(id => id !== appId) })
}

export const contactsService = {
  ...impl,
  getForApplication,
  linkToApplication,
  unlinkFromApplication,
}
