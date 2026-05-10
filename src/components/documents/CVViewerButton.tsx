// ---------------------------------------------------------------------------
// CVViewerButton — requests a 5-minute signed URL and opens the file.
// variant="button" → full button  |  variant="chip" → inline badge/link
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { getSignedUrl } from '@/lib/storage'
import { useToastActions } from '@/hooks/useToast'
import { cn } from '@/lib/cn'

interface CVViewerButtonProps {
  storagePath: string
  label?: string
  variant?: 'button' | 'chip'
  className?: string
}

export function CVViewerButton({
  storagePath,
  label = 'View CV',
  variant = 'button',
  className,
}: CVViewerButtonProps) {
  const [loading, setLoading] = useState(false)
  const toast = useToastActions()

  async function handleClick() {
    if (loading) return
    setLoading(true)
    try {
      const url = await getSignedUrl('cv-files', storagePath, 300)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error(`Could not open file: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'chip') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium text-violet-700 bg-violet-100 hover:bg-violet-200 rounded-full px-2.5 py-0.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        aria-label={label}
      >
        {loading
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : <ExternalLink className="w-3 h-3" />
        }
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
        className,
      )}
      aria-label={label}
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <ExternalLink className="w-4 h-4" />
      }
      {label}
    </button>
  )
}
