// ---------------------------------------------------------------------------
// InterviewFlow — AuthGuard.tsx
// Wraps protected routes. In mock mode, always renders children.
// In Supabase mode, redirects to /login if unauthenticated.
// ---------------------------------------------------------------------------

import { Navigate, Outlet } from 'react-router-dom'
import { useUser } from '@/hooks/useUser'
import { isSupabaseMode } from '@/lib/env'

export function AuthGuard() {
  const { user, loading } = useUser()

  // Mock mode — no auth required
  if (!isSupabaseMode()) return <Outlet />

  // Supabase mode: wait for session hydration
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not signed in — redirect to login
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
