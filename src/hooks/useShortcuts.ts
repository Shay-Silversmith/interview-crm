// ---------------------------------------------------------------------------
// useShortcuts — global keyboard shortcuts
// Sequential shortcuts (g d, n a, …) via a small custom tracker.
// Single-key and combo shortcuts (Cmd+K, ?) via react-hotkeys-hook.
// Both are disabled when an input/textarea/select is focused.
// ---------------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react'
import { useNavigate }                  from 'react-router-dom'
import { useHotkeys }                   from 'react-hotkeys-hook'
import { useSearch }                    from '@/contexts/SearchContext'

/** Returns true when the event target is an editable element */
function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (target.isContentEditable) return true
  return false
}

export function useShortcuts() {
  const navigate = useNavigate()
  const { open: openSearch } = useSearch()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  // ── Cmd/Ctrl+K → open search ─────────────────────────────────────────────
  useHotkeys('mod+k', () => openSearch(), { preventDefault: true })

  // ── ? → show shortcuts modal ──────────────────────────────────────────────
  useHotkeys('?', () => setShortcutsOpen(true), { preventDefault: false })

  // ── Sequential shortcuts (g+key, n+key) ──────────────────────────────────
  const lastKey = useRef<string | null>(null)
  const timer   = useRef<ReturnType<typeof setTimeout>>()

  const SEQUENCES: Record<string, () => void> = {
    'g d': () => navigate('/'),
    'g a': () => navigate('/applications'),
    'g b': () => navigate('/applications/board'),
    'g t': () => navigate('/tasks'),
    'g c': () => navigate('/calendar'),
    'g p': () => navigate('/prep'),
    'g i': () => navigate('/ai'),
    'n a': () => navigate('/applications/new'),
    'n t': () => navigate('/tasks'),
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Skip when a modifier is held (avoid clashing with Cmd+K etc.)
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isEditable(e.target)) return

      if (lastKey.current) {
        const seq = `${lastKey.current} ${e.key}`
        clearTimeout(timer.current)
        lastKey.current = null
        if (SEQUENCES[seq]) {
          e.preventDefault()
          SEQUENCES[seq]()
        }
      } else {
        lastKey.current = e.key
        clearTimeout(timer.current)
        timer.current = setTimeout(() => { lastKey.current = null }, 1000)
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      clearTimeout(timer.current)
    }
    // SEQUENCES is constant; navigate + openSearch are stable refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  return { shortcutsOpen, setShortcutsOpen }
}
