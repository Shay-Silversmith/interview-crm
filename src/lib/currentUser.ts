// ---------------------------------------------------------------------------
// InterviewFlow — currentUser.ts
// Simple in-memory cache for the currently authenticated user ID.
// Set by useUser on every auth state change so other modules can read
// the current user ID synchronously without calling Supabase async APIs.
// ---------------------------------------------------------------------------

let _userId: string | null = null

export function setCurrentUserId(id: string | null): void {
  _userId = id
}

export function getCurrentUserId(): string | null {
  return _userId
}

/**
 * The signed-in user's id, for stamping onto rows being inserted.
 *
 * Every table carries `user_id UUID NOT NULL` with no default and an RLS policy
 * of `auth.uid() = user_id`, so an insert that omits it fails twice over — once
 * on the constraint and once on the policy, which is what surfaced as "new row
 * violates row-level security policy". Nine services were omitting it.
 *
 * Falls back to asking Supabase when the synchronous cache is cold, which it is
 * on the first render after a reload.
 */
export async function requireUserId(): Promise<string> {
  if (_userId) return _userId

  const { getSupabaseClient } = await import('@/lib/supabase')
  const { data } = await getSupabaseClient().auth.getUser()
  const id = data.user?.id
  if (!id) {
    throw new Error('You are signed out, so this cannot be saved. Sign in and try again.')
  }
  _userId = id
  return id
}

/**
 * Why an update matched no row, in words someone can act on.
 *
 * RLS hides rows the request cannot see, so an update silently matches nothing
 * when the session behind it has lapsed — the page still shows cached data, but
 * the request goes out anonymous. The other cause is a row that no longer exists.
 */
export async function noRowUpdatedError(): Promise<Error> {
  const { getSupabaseClient } = await import('@/lib/supabase')
  const { data } = await getSupabaseClient().auth.getSession()
  return new Error(data.session
    ? 'That record was not found — it may have been deleted. Refresh the page and try again.'
    : 'Your session has expired, so the change was not saved. Sign in again and retry.')
}
