import type { CVVersion, Document } from '@/types'
import { mockCVVersions, mockDocuments } from '@/data/mock-documents'
import { MOCK_DELAY_MS } from '@/lib/constants'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

export const documentsService = {
  async listCVVersions(): Promise<CVVersion[]> {
    await delay()
    return [...mockCVVersions]
  },

  async getCVById(id: string): Promise<CVVersion | null> {
    await delay()
    return mockCVVersions.find(cv => cv.id === id) ?? null
  },

  async listDocuments(): Promise<Document[]> {
    await delay()
    return [...mockDocuments]
  },

  async getDocumentById(id: string): Promise<Document | null> {
    await delay()
    return mockDocuments.find(d => d.id === id) ?? null
  },

  async getDocumentsByApplication(applicationId: string): Promise<Document[]> {
    await delay()
    return mockDocuments.filter(d => d.applicationIds.includes(applicationId))
  },

  async createCV(_data: Partial<CVVersion>): Promise<CVVersion> {
    await delay()
    throw new Error('Create not implemented — coming in Phase 5')
  },

  async createDocument(_data: Partial<Document>): Promise<Document> {
    await delay()
    throw new Error('Create not implemented — coming in Phase 5')
  },
}
