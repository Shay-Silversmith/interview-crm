// ---------------------------------------------------------------------------
// InterviewFlow — useUser.ts
// Auth state hook backed by Supabase magic-link auth.
// In mock mode (no env vars), user is always null + loading false.
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { isSupabaseMode } from '@/lib/env'
import { getSupabaseClient } from '@/lib/supabase'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useUser(): AuthState & {
  signIn: (email: string) => Promise<void>
  signOut: () => Promise<void>
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: isSupabaseMode(), // start loading only if Supabase is active
  })

  useEffect(() => {
    if (!isSupabaseMode()) return

    const sb = getSupabaseClient()

    // Hydrate from persisted session
    sb.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false })
    })

    // Subscribe to auth changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, loading: false })
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string): Promise<void> => {
    if (!isSupabaseMode()) return
    const sb = getSupabaseClient()
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  }

  const signOut = async (): Promise<void> => {
    if (!isSupabaseMode()) return
    const sb = getSupabaseClient()
    const { error } = await sb.auth.signOut()
    if (error) throw error
  }

  return { ...state, signIn, signOut }
}
