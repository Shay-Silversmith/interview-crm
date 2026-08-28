import type { CVVersion, Document } from '@/types'
import { mockStore } from '@/data/mock-store'
import { MOCK_DELAY_MS } from '@/lib/constants'
import { isSupabaseMode } from '@/lib/env'
import { getSupabaseClient } from '@/lib/supabase'
import { mapCVVersion, mapDocument } from '@/lib/mappers'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

const mockImpl = {
  async listCVVersions(): Promise<CVVersion[]> { await delay(); return mockStore.cvVersions.list() },
  async getCVById(id: string): Promise<CVVersion | null> { await delay(); return mockStore.cvVersions.getById(id) },
  async listDocuments(): Promise<Document[]> { await delay(); return mockStore.documents.list() },
  async getDocumentById(id: string): Promise<Document | null> { await delay(); return mockStore.documents.getById(id) },
  async getDocumentsByApplication(appId: string): Promise<Document[]> {
    await delay(); return mockStore.documents.list().filter(d => d.applicationIds.includes(appId))
  },
  async createCV(data: Partial<CVVersion>): Promise<CVVersion> { await delay(); return mockStore.cvVersions.create(data) },
  async updateCV(id: string, data: Partial<CVVersion>): Promise<CVVersion> { await delay(); return mockStore.cvVersions.update(id, data) },
  async deleteCV(id: string): Promise<void> { await delay(); mockStore.cvVersions.delete(id) },
  async createDocument(data: Partial<Document>): Promise<Document> { await delay(); return mockStore.documents.create(data) },
  async updateDocument(id: string, data: Partial<Document>): Promise<Document> { await delay(); return mockStore.documents.update(id, data) },
  async deleteDocument(id: string): Promise<void> { await delay(); mockStore.documents.delete(id) },
}

const supabaseImpl = {
  async listCVVersions(): Promise<CVVersion[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('cv_versions').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapCVVersion)
  },
  async getCVById(id: string): Promise<CVVersion | null> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('cv_versions').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data ? mapCVVersion(data) : null
  },
  async listDocuments(): Promise<Document[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('documents').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapDocument)
  },
  async getDocumentById(id: string): Promise<Document | null> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('documents').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data ? mapDocument(data) : null
  },
  async getDocumentsByApplication(appId: string): Promise<Document[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('documents').select('*').eq('application_id', appId)
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapDocument)
  },
  async createCV(data: Partial<CVVersion>): Promise<CVVersion> {
    const sb = getSupabaseClient()
    const { data: inserted, error } = await sb.from('cv_versions').insert({
      name: data.name, version: data.version ?? 1, emphasis: data.emphasis,
      skills_highlighted: data.skillsHighlighted ?? [], projects_highlighted: data.projectsHighlighted ?? [],
      file_name: data.fileName, file_size: data.fileSize, storage_path: data.storagePath,
      notes: data.notes, is_active: data.isActive ?? true,
    }).select().single()
    if (error) throw new Error(error.message)
    return mapCVVersion(inserted)
  },
  async updateCV(id: string, data: Partial<CVVersion>): Promise<CVVersion> {
    const sb = getSupabaseClient()
    const row: Record<string, unknown> = {}
    if (data.name !== undefined) row.name = data.name
    if (data.version !== undefined) row.version = data.version
    if (data.emphasis !== undefined) row.emphasis = data.emphasis
    if (data.skillsHighlighted !== undefined) row.skills_highlighted = data.skillsHighlighted
    if (data.projectsHighlighted !== undefined) row.projects_highlighted = data.projectsHighlighted
    if (data.notes !== undefined) row.notes = data.notes
    if (data.isActive !== undefined) row.is_active = data.isActive
    if (data.storagePath !== undefined) row.storage_path = data.storagePath
    const { data: updated, error } = await sb.from('cv_versions').update(row).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return mapCVVersion(updated)
  },
  async deleteCV(id: string): Promise<void> {
    const sb = getSupabaseClient()
    const { error } = await sb.from('cv_versions').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
  async createDocument(data: Partial<Document>): Promise<Document> {
    const sb = getSupabaseClient()
    const { data: inserted, error } = await sb.from('documents').insert({
      name: data.name, type: data.type ?? 'CV', file_name: data.fileName,
      file_size: data.fileSize, storage_path: data.storagePath,
      notes: data.notes, application_id: data.applicationIds?.[0],
    }).select().single()
    if (error) throw new Error(error.message)
    return mapDocument(inserted)
  },
  async updateDocument(id: string, data: Partial<Document>): Promise<Document> {
    const sb = getSupabaseClient()
    const row: Record<string, unknown> = {}
    if (data.name !== undefined) row.name = data.name
    if (data.type !== undefined) row.type = data.type
    if (data.notes !== undefined) row.notes = data.notes
    const { data: updated, error } = await sb.from('documents').update(row).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return mapDocument(updated)
  },
  async deleteDocument(id: string): Promise<void> {
    const sb = getSupabaseClient()
    const { error } = await sb.from('documents').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

export const documentsService = isSupabaseMode() ? supabaseImpl : mockImpl
