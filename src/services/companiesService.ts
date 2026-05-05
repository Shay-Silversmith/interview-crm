import type { Company } from '@/types'
import { mockCompanies } from '@/data/mock-companies'
import { MOCK_DELAY_MS } from '@/lib/constants'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

export const companiesService = {
  async list(): Promise<Company[]> {
    await delay()
    return [...mockCompanies]
  },

  async getById(id: string): Promise<Company | null> {
    await delay()
    return mockCompanies.find(c => c.id === id) ?? null
  },

  async create(_data: Partial<Company>): Promise<Company> {
    await delay()
    throw new Error('Create not implemented — coming in Phase 5')
  },

  async update(_id: string, _data: Partial<Company>): Promise<Company> {
    await delay()
    throw new Error('Update not implemented — coming in Phase 5')
  },

  async delete(_id: string): Promise<void> {
    await delay()
    throw new Error('Delete not implemented — coming in Phase 5')
  },
}
