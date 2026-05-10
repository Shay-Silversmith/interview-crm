// ---------------------------------------------------------------------------
// DocumentViewerButton — requests a 5-minute signed URL and opens the file.
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { getSignedUrl } from '@/lib/storage'
import { useToastActions } from '@/hooks/useToast'
import { cn } from '@/lib/cn'

interface DocumentViewerButtonProps {
  storagePath: string
  label?: string
  className?: string
}

export function DocumentViewerButton({
  storagePath,
  label = 'View',
  className,
}: DocumentViewerButtonProps) {
  const [loading, setLoading] = useState(false)
  const toast = useToastActions()

  async function handleClick() {
    if (loading) return
    setLoading(true)
    try {
      const url = await getSignedUrl('documents', storagePath, 300)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error(`Could not open file: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
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
