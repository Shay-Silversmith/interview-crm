import type { Task } from '@/types'
import { mockTasks } from '@/data/mock-tasks'
import { MOCK_DELAY_MS } from '@/lib/constants'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

export const tasksService = {
  async list(): Promise<Task[]> {
    await delay()
    return [...mockTasks]
  },

  async getById(id: string): Promise<Task | null> {
    await delay()
    return mockTasks.find(t => t.id === id) ?? null
  },

  async getByApplication(applicationId: string): Promise<Task[]> {
    await delay()
    return mockTasks.filter(t => t.applicationId === applicationId)
  },

  async create(_data: Partial<Task>): Promise<Task> {
    await delay()
    throw new Error('Create not implemented — coming in Phase 5')
  },

  async update(_id: string, _data: Partial<Task>): Promise<Task> {
    await delay()
    throw new Error('Update not implemented — coming in Phase 5')
  },

  async delete(_id: string): Promise<void> {
    await delay()
    throw new Error('Delete not implemented — coming in Phase 5')
  },
}
