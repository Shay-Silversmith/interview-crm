// ---------------------------------------------------------------------------
// InterviewFlow — dataResetService.ts
// "Start fresh" — deletes the signed-in user's data on every owned table.
// Scoped strictly by RLS (auth.uid() = user_id), so users cannot affect
// other users' data even if this code is misused.
//
// Mock mode: clears localStorage via mockStore.__clearAll().
// ---------------------------------------------------------------------------

import { isSupabaseMode } from '@/lib/env'
import { getSupabaseClient } from '@/lib/supabase'
import { mockStore } from '@/data/mock-store'

// Tables to clear. profiles is intentionally NOT included — we keep the
// user's profile row so display_name etc. persists after Start Fresh.
const USER_TABLES = [
  'recent_activity',
  'ai_summaries',
  'prepared_answers',
  'interview_stages',
  'job_applications',
  'tasks',
  'calendar_events',
  'documents',
  'cv_versions',
  'contacts',
  'companies',
] as const

export async function startFresh(): Promise<void> {
  if (!isSupabaseMode()) {
    mockStore.__clearAll()
    return
  }

  const sb = getSupabaseClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Not signed in')

  // Each DELETE is RLS-scoped to auth.uid() = user_id, so this only
  // affects the signed-in user's rows. The explicit user_id filter is
  // belt-and-suspenders defence — RLS would block cross-user deletes anyway.
  for (const table of USER_TABLES) {
    const { error } = await sb.from(table).delete().eq('user_id', user.id)
    if (error) throw new Error(`Failed to clear ${table}: ${error.message}`)
  }

  // Also clear any browser-side cache so the UI immediately reflects empty state.
  mockStore.__clearAll()
}
