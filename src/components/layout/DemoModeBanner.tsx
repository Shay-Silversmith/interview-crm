import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import { isDemoMode } from '@/services/aiClientService'

const DISMISS_KEY = 'interviewflow.demoBannerDismissed'

export function DemoModeBanner() {
  const [demo, setDemo] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })

  useEffect(() => {
    setDemo(isDemoMode())
    // Re-check when the user navigates back from settings, etc.
    const onFocus = () => setDemo(isDemoMode())
    window.addEventListener('focus', onFocus)
    window.addEventListener('storage', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('storage', onFocus)
    }
  }, [])

  if (!demo || dismissed) return null

  const handleDismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
    setDismissed(true)
  }

  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm">
      <Sparkles className="w-4 h-4 shrink-0" />
      <span>
        <span className="font-semibold">Sample AI</span> — AI tools are returning example output, not real results.{' '}
        <Link to="/settings" className="underline font-semibold hover:text-white/90">
          Add your Gemini API key
        </Link>{' '}
        for live AI.
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="ms-2 text-white/70 hover:text-white shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
