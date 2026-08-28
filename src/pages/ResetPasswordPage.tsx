// ---------------------------------------------------------------------------
// InterviewFlow — ResetPasswordPage.tsx
// Step 2 of password recovery: the destination of the emailed recovery link.
//
// Supabase's client parses the recovery token out of the URL hash on load
// (detectSessionInUrl) and emits PASSWORD_RECOVERY, which puts the browser in a
// short-lived authenticated session scoped to changing the password. Until that
// session exists we must not show the form — otherwise updateUser would fail
// with a confusing "Auth session missing" error.
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isSupabaseMode } from '@/lib/env'
import { getSupabaseClient } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { AuthCard } from '@/components/layout/AuthCard'

type LinkState = 'checking' | 'ready' | 'invalid'

export function ResetPasswordPage() {
  const { updatePassword } = useUser()
  const navigate = useNavigate()

  const [linkState, setLinkState] = useState<LinkState>('checking')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [done,      setDone]      = useState(false)

  // Decide whether we actually arrived here from a valid recovery link.
  useEffect(() => {
    if (!isSupabaseMode()) { setLinkState('invalid'); return }

    const sb = getSupabaseClient()
    let settled = false

    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        settled = true
        setLinkState('ready')
      }
    })

    // The hash may already have been consumed before this listener attached.
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) { settled = true; setLinkState('ready') }
    })

    // An error comes back in the hash when the link is expired or already used.
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    if (hash.get('error')) { settled = true; setLinkState('invalid') }

    const timer = setTimeout(() => { if (!settled) setLinkState('invalid') }, 4000)

    return () => { subscription.unsubscribe(); clearTimeout(timer) }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
      // The recovery session is already a real session, so send them straight in.
      setTimeout(() => navigate('/', { replace: true }), 1800)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (linkState === 'checking') {
    return (
      <AuthCard subtitle="Checking your link…">
        <p className="text-sm text-slate-500 text-center">One moment.</p>
      </AuthCard>
    )
  }

  if (linkState === 'invalid') {
    return (
      <AuthCard subtitle="This link is no longer valid">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Password reset links expire after an hour and can only be used once.
            Request a fresh one and it will work.
          </p>
          <Link
            to="/forgot-password"
            className="block w-full h-9 leading-9 text-center bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Send a new link
          </Link>
        </div>
      </AuthCard>
    )
  }

  if (done) {
    return (
      <AuthCard subtitle="Password updated">
        <p className="text-sm text-slate-600 text-center leading-relaxed">
          You are signed in. Taking you to your workspace…
        </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard subtitle="Choose a new password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-colors"
          />
          <p className="text-xs text-slate-400">At least 6 characters.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="confirm" className="block text-sm font-medium text-slate-700">
            Confirm new password
          </label>
          <input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-colors"
          />
        </div>

        {error && (
          <p className="text-xs text-danger-600 bg-danger-50 border border-danger-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password || !confirm}
          className="w-full h-9 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </AuthCard>
  )
}
