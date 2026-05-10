// ---------------------------------------------------------------------------
// InterviewFlow — LoginPage.tsx
// Magic-link sign-in. Only shown in Supabase mode when unauthenticated.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { useUser } from '@/hooks/useUser'

export function LoginPage() {
  const { signIn } = useUser()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn(email)
      setSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-card p-8 space-y-6">
        {/* Logo / brand */}
        <div className="text-center">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-lg font-bold select-none">IF</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900">InterviewFlow</h1>
          <p className="text-sm text-slate-500 mt-1">Your job-search command centre</p>
        </div>

        {sent ? (
          <div className="text-center py-2 space-y-1">
            <p className="text-sm font-medium text-success-700">Check your inbox ✉️</p>
            <p className="text-sm text-slate-500">
              Magic link sent to <span className="font-medium text-slate-700">{email}</span>
            </p>
            <button
              className="mt-3 text-xs text-slate-400 underline"
              onClick={() => { setSent(false); setEmail('') }}
            >
              Use a different address
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
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
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
