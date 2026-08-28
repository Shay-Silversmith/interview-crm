// ---------------------------------------------------------------------------
// InterviewFlow — LoginPage.tsx
// Email + password sign-in / sign-up. Only shown in Supabase mode.
//
// Presentation follows the app's hero-surface pattern (dot-grid over white,
// rounded-2xl, slate-200/80 hairline, shadow-card) so the first screen a user
// sees already looks like the product behind it. Controls come from the shared
// Button/Input primitives rather than hand-rolled markup — that is what keeps
// the auth screens from drifting away from the app over time.
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { BrandMark } from '@/components/ui/BrandMark'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Mode = 'signin' | 'signup'
type FieldErrors = Partial<Record<'email' | 'password' | 'confirm' | 'displayName', string>>

// Auth screens are a one-off moment, not a dense CRM table: the shared inputs
// default to the app's h-9 density, so they get bumped to a comfortable h-11.
const FIELD = 'h-11'

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

  const [mode,        setMode]        = useState<Mode>('signin')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [done,        setDone]        = useState<string | null>(null)

  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors,  setFieldErrors]  = useState<FieldErrors>({})

  // The submit error doubles as the form's error summary, so it takes focus
  // after a failed attempt — a screen reader user should not have to hunt for
  // the reason their sign-in did not go through.
  const errorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setDone(null)
    setPassword('')
    setConfirm('')
    setDisplayName('')
    setShowPassword(false)
    setFieldErrors({})
  }

  // Validate on blur rather than only on submit, so a typo surfaces next to the
  // field that caused it while the user is still looking at it.
  const validateField = (field: keyof FieldErrors, value: string): string | undefined => {
    if (!value) return undefined // don't scold an untouched field
    switch (field) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'Enter a valid email address.'
      case 'password':
        return value.length >= 6 ? undefined : 'Password must be at least 6 characters.'
      case 'confirm':
        return value === password ? undefined : 'Passwords do not match.'
      case 'displayName': {
        const t = value.trim()
        return t.length >= 2 && t.length <= 60 ? undefined : 'Display name must be 2–60 characters.'
      }
    }
  }

  const handleBlur = (field: keyof FieldErrors, value: string) =>
    setFieldErrors(prev => ({ ...prev, [field]: validateField(field, value) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'signup') {
      const trimmedName = displayName.trim()
      if (trimmedName.length < 2 || trimmedName.length > 60) {
        setError('Display name must be 2–60 characters.')
        return
      }
      if (password !== confirm) {
        setError('Passwords do not match.')
        return
      }
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
        const { needsConfirmation } = await signUp(email, password, displayName)
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

  const isSignin = mode === 'signin'

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      {/* A single soft indigo bloom behind the card. Keeps the page from reading
          as a flat grey rectangle without introducing a colour the app doesn't
          already use. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 flex items-center justify-center"
      >
        <div className="w-[520px] h-[520px] max-w-[90vw] max-h-[70vh] rounded-full bg-primary-500/10 blur-3xl" />
      </div>

      <div className="force-ltr relative w-full max-w-sm">
        <div className="dot-grid-bg bg-surface rounded-2xl border border-slate-200/80 shadow-card p-8 space-y-6">

          {/* Brand */}
          <div className="text-center">
            <BrandMark size="lg" className="mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900">InterviewFlow</h1>
            <p className="text-sm text-slate-500 mt-1">
              {isSignin ? 'Sign in to your workspace' : 'Create your account'}
            </p>
          </div>

          {/* Success message after signup */}
          {done && (
            <div
              role="status"
              className="flex items-start gap-2 text-sm text-success-700 bg-success-50 border border-success-200 rounded-lg px-3 py-2"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
              <span>{done}</span>
            </div>
          )}

          {/* Submit error — also the form's error summary, hence role/tabIndex */}
          {error && (
            <div
              ref={errorRef}
              role="alert"
              tabIndex={-1}
              className="flex items-start gap-2 text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-danger-500/30"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display name — signup only */}
            {!isSignin && (
              <Input
                id="displayName"
                label="Display name"
                type="text"
                required
                minLength={2}
                maxLength={60}
                autoComplete="name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onBlur={e => handleBlur('displayName', e.target.value)}
                error={fieldErrors.displayName}
                leftIcon={<User className="w-4 h-4" aria-hidden />}
                placeholder="How should we greet you?"
                className={FIELD}
              />
            )}

            <Input
              id="email"
              label="Email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={e => handleBlur('email', e.target.value)}
              error={fieldErrors.email}
              leftIcon={<Mail className="w-4 h-4" aria-hidden />}
              placeholder="you@example.com"
              className={FIELD}
            />

            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete={isSignin ? 'current-password' : 'new-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={e => handleBlur('password', e.target.value)}
              error={fieldErrors.password}
              leftIcon={<Lock className="w-4 h-4" aria-hidden />}
              placeholder="••••••••"
              className={FIELD}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Confirm password — signup only */}
            {!isSignin && (
              <Input
                id="confirm"
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onBlur={e => handleBlur('confirm', e.target.value)}
                error={fieldErrors.confirm}
                leftIcon={<Lock className="w-4 h-4" aria-hidden />}
                placeholder="••••••••"
                className={FIELD}
              />
            )}

            <Button type="submit" size="lg" loading={loading} disabled={!email || !password} className="w-full">
              {loading
                ? (isSignin ? 'Signing in…' : 'Creating account…')
                : (isSignin ? 'Sign in' : 'Create account')}
            </Button>

            {/* Password recovery — sign-in only */}
            {isSignin && (
              <p className="text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm text-slate-500 hover:text-primary-600 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                >
                  Forgot your password?
                </Link>
              </p>
            )}
          </form>
        </div>

        {/* Mode toggle lives outside the card: it switches which form you are
            looking at, so it is not part of the form itself. */}
        <p className="text-center text-sm text-slate-500 mt-5">
          {isSignin ? 'No account? ' : 'Already have an account? '}
          <button
            type="button"
            onClick={() => switchMode(isSignin ? 'signup' : 'signin')}
            className="text-primary-600 hover:underline font-medium rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
          >
            {isSignin ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
