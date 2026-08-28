// ---------------------------------------------------------------------------
// InterviewFlow — ForgotPasswordPage.tsx
// Step 1 of password recovery: ask Supabase to email a recovery link.
// Public route. Deliberately does NOT reveal whether the address is registered.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@/hooks/useUser'
import { AuthCard } from '@/components/layout/AuthCard'

export function ForgotPasswordPage() {
  const { resetPassword } = useUser()

  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await resetPassword(email)
      // Always report success. Confirming which addresses exist would let anyone
      // enumerate accounts from the login screen.
      setSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthCard subtitle="Check your inbox">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            If an account exists for <span className="font-medium text-slate-900">{email}</span>,
            a password reset link is on its way. The link is valid for one hour.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Nothing after a few minutes? Check the spam folder, and make sure the
            address matches the one you signed up with.
          </p>
          <Link
            to="/login"
            className="block w-full h-9 leading-9 text-center bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard subtitle="Reset your password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          Enter the email address on your account and we will send you a link to
          choose a new password.
        </p>

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

        {error && (
          <p className="text-xs text-danger-600 bg-danger-50 border border-danger-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full h-9 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500">
        Remembered it?{' '}
        <Link to="/login" className="text-primary-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthCard>
  )
}
