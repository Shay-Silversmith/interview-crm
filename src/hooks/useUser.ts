// ---------------------------------------------------------------------------
// InterviewFlow — useUser.ts
// Auth state hook backed by Supabase email+password auth.
// In mock mode (no env vars), user is always null + loading false.
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { isSupabaseMode } from '@/lib/env'
import { getSupabaseClient } from '@/lib/supabase'
import { profilesService } from '@/services/profilesService'
import { setCurrentUserId } from '@/lib/currentUser'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useUser(): AuthState & {
  signIn:  (email: string, password: string) => Promise<void>
  signUp:  (email: string, password: string, displayName: string) => Promise<{ needsConfirmation: boolean }>
  signOut: () => Promise<void>
  resetPassword:  (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: isSupabaseMode(),
  })

  useEffect(() => {
    if (!isSupabaseMode()) return

    const sb = getSupabaseClient()

    sb.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false })
    })

    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      setState({ user: session?.user ?? null, session, loading: false })
      setCurrentUserId(session?.user?.id ?? null)
      // Ensure a profile row exists the first time a user signs in
      if (event === 'SIGNED_IN' && session?.user?.email) {
        profilesService.ensureProfile(session.user.email).catch(() => { /* silent */ })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<void> => {
    if (!isSupabaseMode()) return
    const sb = getSupabaseClient()
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, displayName: string): Promise<{ needsConfirmation: boolean }> => {
    if (!isSupabaseMode()) return { needsConfirmation: false }
    const sb = getSupabaseClient()
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: displayName.trim() },
      },
    })
    if (error) throw error
    // With mailer_autoconfirm=true (set via Management API), data.session is non-null.
    // If a future config disables autoconfirm, data.session will be null and the
    // user must click the confirmation email link.
    const needsConfirmation = !!data.user && !data.session
    // Defensive fallback — the on_auth_user_created trigger should have created
    // the profile row already, but ensureProfile is idempotent.
    if (data.session) {
      await profilesService.ensureProfile(email)
    }
    return { needsConfirmation }
  }

  const signOut = async (): Promise<void> => {
    if (!isSupabaseMode()) return
    const sb = getSupabaseClient()
    const { error } = await sb.auth.signOut()
    if (error) throw error
  }

  /** Email a password-recovery link. The link lands on /reset-password. */
  const resetPassword = async (email: string): Promise<void> => {
    if (!isSupabaseMode()) return
    const sb = getSupabaseClient()
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  /** Set a new password using the session the recovery link established. */
  const updatePassword = async (password: string): Promise<void> => {
    if (!isSupabaseMode()) return
    const sb = getSupabaseClient()
    const { error } = await sb.auth.updateUser({ password })
    if (error) throw error
  }

  return { ...state, signIn, signUp, signOut, resetPassword, updatePassword }
}
