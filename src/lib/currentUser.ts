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
