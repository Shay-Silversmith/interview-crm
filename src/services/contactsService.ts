import type { Contact } from '@/types'
import { mockContacts } from '@/data/mock-contacts'
import { MOCK_DELAY_MS } from '@/lib/constants'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

export const contactsService = {
  async list(): Promise<Contact[]> {
    await delay()
    return [...mockContacts]
  },

  async getById(id: string): Promise<Contact | null> {
    await delay()
    return mockContacts.find(c => c.id === id) ?? null
  },

  async getByApplication(applicationId: string): Promise<Contact[]> {
    await delay()
    return mockContacts.filter(c => c.applicationIds.includes(applicationId))
  },

  async getByCompany(companyId: string): Promise<Contact[]> {
    await delay()
    return mockContacts.filter(c => c.companyId === companyId)
  },

  async create(_data: Partial<Contact>): Promise<Contact> {
    await delay()
    throw new Error('Create not implemented — coming in Phase 5')
  },

  async update(_id: string, _data: Partial<Contact>): Promise<Contact> {
    await delay()
    throw new Error('Update not implemented — coming in Phase 5')
  },

  async delete(_id: string): Promise<void> {
    await delay()
    throw new Error('Delete not implemented — coming in Phase 5')
  },
}
