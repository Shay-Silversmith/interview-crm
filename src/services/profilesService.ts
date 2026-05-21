// ---------------------------------------------------------------------------
// InterviewFlow — profilesService.ts
//
// Mock mode:    returns mockUser always.
// Supabase mode: reads/writes the `profiles` table for the current user.
//
// Auto-init: ensureProfile() is called after a new user signs up.
//            It creates a minimal profile row if one doesn't exist yet.
// ---------------------------------------------------------------------------

import type { UserProfile } from '@/types'
import { mockUser } from '@/data/mock-user'
import { isSupabaseMode } from '@/lib/env'
import { getSupabaseClient } from '@/lib/supabase'
import { mapProfile } from '@/lib/mappers'

const mockImpl = {
  async getProfile(): Promise<UserProfile | null> {
    return mockUser
  },
  async ensureProfile(_email: string): Promise<void> {
    // no-op in mock mode
  },
  async updateProfile(_data: Partial<UserProfile>): Promise<UserProfile | null> {
    return mockUser
  },
}

const supabaseImpl = {
  async getProfile(): Promise<UserProfile | null> {
    const sb = getSupabaseClient()
    const { data: { user }, error: authError } = await sb.auth.getUser()
    if (authError || !user) return null

    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null   // no row yet
      throw new Error(error.message)
    }

    return data ? mapProfile(data) : null
  },

  /** Create a minimal profile row for a brand-new user if one doesn't exist. */
  async ensureProfile(email: string): Promise<void> {
    const sb = getSupabaseClient()
    const { data: { user }, error: authError } = await sb.auth.getUser()
    if (authError || !user) return

    // Check if profile already exists
    const { data: existing } = await sb
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existing) return   // already has a profile

    // Insert minimal profile
    await sb.from('profiles').insert({
      id: user.id,
      name: email.split('@')[0],   // derive name from email as starter
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile | null> {
    const sb = getSupabaseClient()
    const { data: { user }, error: authError } = await sb.auth.getUser()
    if (authError || !user) return null

    const { data: updated, error } = await sb
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return updated ? mapProfile(updated) : null
  },
}

export const profilesService = isSupabaseMode() ? supabaseImpl : mockImpl
