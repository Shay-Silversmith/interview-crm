// ---------------------------------------------------------------------------
// InterviewFlow — storage.ts
// Thin helpers around Supabase Storage.
// In mock mode: uses URL.createObjectURL + an in-memory Map so nothing
// touches the network during local dev.
// ---------------------------------------------------------------------------

import { isSupabaseMode } from './env'
import { getSupabaseClient } from './supabase'

// ---------------------------------------------------------------------------
// Path builders
// ---------------------------------------------------------------------------

/** Replaces characters that are unsafe in storage paths */
function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export function buildCVPath(userId: string, fileName: string): string {
  const uuid = crypto.randomUUID()
  return `${userId}/cv-versions/${uuid}/${sanitize(fileName)}`
}

export function buildDocPath(userId: string, fileName: string): string {
  const uuid = crypto.randomUUID()
  return `${userId}/docs/${uuid}/${sanitize(fileName)}`
}

// ---------------------------------------------------------------------------
// Supabase implementation
// ---------------------------------------------------------------------------

const supabaseStorage = {
  async uploadToBucket(bucket: string, path: string, file: File): Promise<string> {
    const sb = getSupabaseClient()
    const { error } = await sb.storage.from(bucket).upload(path, file, { upsert: false })
    if (error) throw new Error(error.message)
    return path
  },

  async getSignedUrl(bucket: string, path: string, expiresInSeconds = 300): Promise<string> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, expiresInSeconds)
    if (error) throw new Error(error.message)
    return data.signedUrl
  },

  async deleteFromBucket(bucket: string, path: string): Promise<void> {
    const sb = getSupabaseClient()
    const { error } = await sb.storage.from(bucket).remove([path])
    if (error) throw new Error(error.message)
  },

  async getCurrentUserId(): Promise<string> {
    const sb = getSupabaseClient()
    const { data: { user }, error } = await sb.auth.getUser()
    if (error || !user) throw new Error('Not authenticated')
    return user.id
  },
}

// ---------------------------------------------------------------------------
// Mock implementation (URL.createObjectURL + in-memory Map)
// ---------------------------------------------------------------------------

/** path → object URL */
const mockBlobMap = new Map<string, string>()

const mockStorage = {
  async uploadToBucket(_bucket: string, path: string, file: File): Promise<string> {
    const objectUrl = URL.createObjectURL(file)
    mockBlobMap.set(path, objectUrl)
    return path
  },

  async getSignedUrl(_bucket: string, path: string, _expiresInSeconds = 300): Promise<string> {
    const url = mockBlobMap.get(path)
    if (!url) throw new Error(`Mock: no file stored at path "${path}"`)
    return url
  },

  async deleteFromBucket(_bucket: string, path: string): Promise<void> {
    const url = mockBlobMap.get(path)
    if (url) {
      URL.revokeObjectURL(url)
      mockBlobMap.delete(path)
    }
  },

  async getCurrentUserId(): Promise<string> {
    return 'mock-user-id'
  },
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

const impl = isSupabaseMode() ? supabaseStorage : mockStorage

export const uploadToBucket     = impl.uploadToBucket.bind(impl)
export const getSignedUrl       = impl.getSignedUrl.bind(impl)
export const deleteFromBucket   = impl.deleteFromBucket.bind(impl)
export const getCurrentUserId   = impl.getCurrentUserId.bind(impl)
