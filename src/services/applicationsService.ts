import type { JobApplication } from '@/types'
import { mockApplications } from '@/data/mock-applications'
import { MOCK_DELAY_MS } from '@/lib/constants'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

export const applicationsService = {
  async list(): Promise<JobApplication[]> {
    await delay()
    return [...mockApplications]
  },

  async getById(id: string): Promise<JobApplication | null> {
    await delay()
    return mockApplications.find(a => a.id === id) ?? null
  },

  async getByCompany(companyId: string): Promise<JobApplication[]> {
    await delay()
    return mockApplications.filter(a => a.companyId === companyId)
  },

  async create(_data: Partial<JobApplication>): Promise<JobApplication> {
    await delay()
    throw new Error('Create not implemented — coming in Phase 5')
  },

  async update(_id: string, _data: Partial<JobApplication>): Promise<JobApplication> {
    await delay()
    throw new Error('Update not implemented — coming in Phase 5')
  },

  async delete(_id: string): Promise<void> {
    await delay()
    throw new Error('Delete not implemented — coming in Phase 5')
  },
}
