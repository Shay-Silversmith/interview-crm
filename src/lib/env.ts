// ---------------------------------------------------------------------------
// InterviewFlow — env.ts
// Reads Supabase env vars from Vite's import.meta.env.
// When VITE_SUPABASE_URL is absent, the app runs in mock-data mode.
// ---------------------------------------------------------------------------

/** Supabase project URL — set via VITE_SUPABASE_URL in .env.local */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined

/** Supabase anon (public) key — set via VITE_SUPABASE_ANON_KEY in .env.local */
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined

/**
 * Returns true when VITE_SUPABASE_URL is present.
 * All services use this to choose between mock and live implementations.
 */
export function isSupabaseMode(): boolean {
  return Boolean(SUPABASE_URL)
}

/**
 * Returns true when VITE_AI_ENABLED=true is set.
 * Live AI functions require both this flag AND ANTHROPIC_API_KEY on the server.
 * When false, all AI service functions fall back to mock output immediately.
 */
export function isAIEnabled(): boolean {
  return import.meta.env.VITE_AI_ENABLED === 'true'
}
