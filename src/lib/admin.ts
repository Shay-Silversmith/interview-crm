// ---------------------------------------------------------------------------
// InterviewFlow — admin.ts
// Frontend admin gate. Compares the signed-in user's email to VITE_ADMIN_EMAIL.
//
// SECURITY NOTE: This is a UX gate only. The DB enforces user_id isolation via
// RLS regardless of this flag — admins CANNOT see other users' data. The flag
// only decides which UI elements render (e.g. the demo-mode toggle).
// ---------------------------------------------------------------------------

import { useUser } from '@/hooks/useUser'

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase()

export function useIsAdmin(): boolean {
  const { user } = useUser()
  if (!ADMIN_EMAIL || !user?.email) return false
  return user.email.trim().toLowerCase() === ADMIN_EMAIL
}
