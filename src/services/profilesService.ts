// ---------------------------------------------------------------------------
// InterviewFlow — profilesService.ts
// Fetches the current user's profile row.
//
// Mock mode:  returns mockUser directly (always present).
// Supabase mode: SELECT from profiles WHERE id = auth.uid().
//               Returns null when the profiles row hasn't been created yet
//               (e.g. a brand-new user who hasn't filled in their profile).
//
// Update / edit is intentionally not implemented here — deferred to a future
// "Edit Profile" feature. This service is read-only.
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
}

const supabaseImpl = {
  async getProfile(): Promise<UserProfile | null> {
    const sb = getSupabaseClient()

    // Resolve the authenticated user first
    const { data: { user }, error: authError } = await sb.auth.getUser()
    if (authError || !user) return null

    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      // PGRST116 = "no rows" — profile hasn't been seeded yet, return null
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }

    return data ? mapProfile(data) : null
  },
}

export const profilesService = isSupabaseMode() ? supabaseImpl : mockImpl
