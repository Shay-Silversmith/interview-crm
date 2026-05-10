// ---------------------------------------------------------------------------
// InterviewFlow — useProfile.ts
// Fetches the current user's profile via profilesService.
// Returns { profile, loading, error } — profile is null while loading or
// when no profiles row exists yet in Supabase mode.
//
// Consumers should fall back to mockUser fields explicitly at each call site:
//   profile?.preferredName ?? mockUser.preferredName ?? 'there'
// This keeps the fallback visible and makes it easy to find later.
// ---------------------------------------------------------------------------

import { useMockStore } from '@/hooks/useMockStore'
import { profilesService } from '@/services/profilesService'
import { QK } from '@/lib/query-keys'
import type { UserProfile } from '@/types'

export interface UseProfileResult {
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

export function useProfile(): UseProfileResult {
  const { data, loading, error } = useMockStore(
    () => profilesService.getProfile(),
    [],
    { key: QK.profile.all() },
  )

  return { profile: data, loading, error }
}
