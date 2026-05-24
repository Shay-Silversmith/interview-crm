// ---------------------------------------------------------------------------
// InterviewFlow — aiKey.ts
// Per-user Gemini API key stored in localStorage. The key is sent to our
// /api/ai/* serverless functions as the `x-gemini-api-key` header; those
// functions are the ONLY place the key leaves the browser, and they forward
// it only to Google's Gemini API.
//
// Security note: localStorage is XSS-readable. For higher security in a
// future iteration, move the key to a server-side store (Supabase Vault or
// a profiles.gemini_api_key column protected by RLS).
// ---------------------------------------------------------------------------

const KEY_STORAGE = 'interviewflow_gemini_key'

export function getStoredGeminiKey(): string | null {
  try { return localStorage.getItem(KEY_STORAGE) } catch { return null }
}

export function setStoredGeminiKey(key: string): void {
  try { localStorage.setItem(KEY_STORAGE, key.trim()) } catch { /* ignore */ }
}

export function clearStoredGeminiKey(): void {
  try { localStorage.removeItem(KEY_STORAGE) } catch { /* ignore */ }
}

export function hasStoredGeminiKey(): boolean {
  const v = getStoredGeminiKey()
  return v !== null && v.trim().length > 0
}

/**
 * Headers to attach to every /api/ai/* request.
 * Throws Error('NO_API_KEY') if the user hasn't set a key yet — callers
 * should catch this and either surface a toast or fall back to mock data.
 */
export function aiHeaders(): HeadersInit {
  const apiKey = getStoredGeminiKey()
  if (!apiKey || !apiKey.trim()) throw new Error('NO_API_KEY')
  return {
    'content-type':     'application/json',
    'x-gemini-api-key': apiKey.trim(),
  }
}
