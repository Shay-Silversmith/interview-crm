import type { AISummary } from '@/types'
import type { AIToolType } from '@/lib/enums'
import { mockAISummaries } from '@/data/mock-ai'
import { MOCK_DELAY_MS } from '@/lib/constants'

const delay = (extraMs = 0) => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + extraMs + Math.random() * 100))

export const aiService = {
  async list(): Promise<AISummary[]> {
    await delay()
    return [...mockAISummaries]
  },

  async getById(id: string): Promise<AISummary | null> {
    await delay()
    return mockAISummaries.find(s => s.id === id) ?? null
  },

  async getByToolType(toolType: AIToolType): Promise<AISummary[]> {
    await delay()
    return mockAISummaries.filter(s => s.toolType === toolType)
  },

  async getByApplication(applicationId: string): Promise<AISummary[]> {
    await delay()
    return mockAISummaries.filter(s => s.applicationId === applicationId)
  },

  // Simulates an AI generation call — returns mocked output with extra delay
  async generate(_toolType: AIToolType, _inputData: Record<string, string>): Promise<AISummary> {
    await delay(800)
    throw new Error('Real AI generation not implemented — coming in Phase 7')
  },
}
