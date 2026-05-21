// ---------------------------------------------------------------------------
// InterviewFlow — LoginPage.tsx
// Email + password sign-in / sign-up. Only shown in Supabase mode.
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '@/hooks/useUser'

type Mode = 'signin' | 'signup'

export function LoginPage() {
  const { user, signIn, signUp } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  // Once authenticated, leave the login page. Honor a redirect `from` if present
  // (e.g. AuthGuard sends an unauthed user to /login but remembers their target).
  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(from, { replace: true })
    }
  }, [user, navigate, location.state])

  const [mode,     setMode]     = useState<Mode>('signin')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [done,     setDone]     = useState<string | null>(null)

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setDone(null)
    setPassword('')
    setConfirm('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
        // AuthGuard re-renders and redirects to app automatically on session change
      } else {
        const { needsConfirmation } = await signUp(email, password)
        if (needsConfirmation) {
          setDone(`Account created! Check ${email} for a confirmation link, then sign in.`)
          switchMode('signin')
        }
        // If email confirmation is off, session fires → AuthGuard redirects automatically
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-card p-8 space-y-6">

        {/* Brand */}
        <div className="text-center">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-lg font-bold select-none">IF</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900">InterviewFlow</h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'signin' ? 'Sign in to your workspace' : 'Create your account'}
          </p>
        </div>

        {/* Success message after signup */}
        {done && (
          <div className="text-sm text-success-700 bg-success-50 border border-success-200 rounded-lg px-3 py-2 text-center">
            {done}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-colors"
            />
          </div>

          {/* Confirm password — signup only */}
          {mode === 'signup' && (
            <div className="space-y-1">
              <label htmlFor="confirm" className="block text-sm font-medium text-slate-700">
                Confirm password
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
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-danger-600 bg-danger-50 border border-danger-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-9 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading
              ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
              : (mode === 'signin' ? 'Sign in' : 'Create account')}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-xs text-slate-500">
          {mode === 'signin' ? (
            <>
              No account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-primary-600 hover:underline font-medium"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-primary-600 hover:underline font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
