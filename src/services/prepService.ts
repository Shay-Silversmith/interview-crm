import type { PreparedAnswer } from '@/types'
import type { PrepCategory } from '@/lib/enums'
import { mockPreparedAnswers } from '@/data/mock-prep'
import { MOCK_DELAY_MS } from '@/lib/constants'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

export const prepService = {
  async list(): Promise<PreparedAnswer[]> {
    await delay()
    return [...mockPreparedAnswers]
  },

  async getById(id: string): Promise<PreparedAnswer | null> {
    await delay()
    return mockPreparedAnswers.find(a => a.id === id) ?? null
  },

  async getByCategory(category: PrepCategory): Promise<PreparedAnswer[]> {
    await delay()
    return mockPreparedAnswers.filter(a => a.category === category)
  },

  async getByApplication(applicationId: string): Promise<PreparedAnswer[]> {
    await delay()
    return mockPreparedAnswers.filter(a => a.applicationIds?.includes(applicationId))
  },

  async create(_data: Partial<PreparedAnswer>): Promise<PreparedAnswer> {
    await delay()
    throw new Error('Create not implemented — coming in Phase 5')
  },

  async update(_id: string, _data: Partial<PreparedAnswer>): Promise<PreparedAnswer> {
    await delay()
    throw new Error('Update not implemented — coming in Phase 5')
  },

  async delete(_id: string): Promise<void> {
    await delay()
    throw new Error('Delete not implemented — coming in Phase 5')
  },
}
