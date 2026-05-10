// ---------------------------------------------------------------------------
// InterviewFlow — supabase.ts
// Lazy singleton Supabase client.
// Only instantiated when env vars are present (Supabase mode).
// ---------------------------------------------------------------------------

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env'

type SupabaseClient = ReturnType<typeof createClient<Database>>

let _client: SupabaseClient | null = null

/**
 * Returns the singleton Supabase client.
 * Throws if env vars are missing — always guard with isSupabaseMode() first.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
    )
  }
  if (!_client) {
    _client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }
  return _client
}
