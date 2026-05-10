// ---------------------------------------------------------------------------
// EditableEnumChip — wraps any badge with click-to-edit select behaviour.
// Click badge → select dropdown opens with current value pre-selected.
// Change → commits immediately and closes. Escape / blur → cancels.
// First hover in session shows a "Click to edit" hint via sessionStorage flag.
// ---------------------------------------------------------------------------
import { useState, useRef, useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

const HINT_KEY = 'interviewflow_chip_edit_hint_shown'

interface EditableEnumChipProps<T extends string> {
  value: T
  options: { value: T; label: string }[]
  /** Called with the new value immediately after the user selects. */
  onCommit: (newValue: T) => void
  /** Renders the badge in read-only mode. */
  renderBadge: (value: T) => ReactNode
  /** Disables the click-to-edit (e.g. while a mutation is in flight). */
  disabled?: boolean
  className?: string
}

/** Hook that returns "show once per browser session" hint state. */
function useOneTimeHint() {
  const alreadyShown = useRef(
    typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem(HINT_KEY)
  )
  const [hintVisible, setHintVisible] = useState(false)

  const onMouseEnter = () => {
    if (!alreadyShown.current) {
      setHintVisible(true)
      sessionStorage.setItem(HINT_KEY, '1')
      alreadyShown.current = true
    }
  }
  const onMouseLeave = () => setHintVisible(false)

  return { hintVisible, onMouseEnter, onMouseLeave }
}

export function EditableEnumChip<T extends string>({
  value,
  options,
  onCommit,
  renderBadge,
  disabled = false,
  className,
}: EditableEnumChipProps<T>) {
  const [editing, setEditing] = useState(false)
  const selectRef = useRef<HTMLSelectElement>(null)
  const { hintVisible, onMouseEnter, onMouseLeave } = useOneTimeHint()

  // Auto-focus the select when it mounts
  useEffect(() => {
    if (editing) selectRef.current?.focus()
  }, [editing])

  const open = () => {
    if (!disabled) setEditing(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as T
    setEditing(false)
    if (next !== value) onCommit(next)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === 'Escape') setEditing(false)
  }

  // Delay lets the browser register a click-on-option before the blur fires
  const handleBlur = () => setTimeout(() => setEditing(false), 100)

  if (editing) {
    return (
      <select
        ref={selectRef}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'h-6 rounded-full px-2 py-0 text-xs font-medium border border-primary-400 bg-white',
          'text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40 cursor-pointer',
          className
        )}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        type="button"
        onClick={open}
        disabled={disabled}
        aria-label="Click to edit"
        className={cn(
          'rounded-full transition-all duration-150 focus:outline-none',
          !disabled && [
            'cursor-pointer',
            'hover:ring-2 hover:ring-primary-400/60 hover:ring-offset-1',
            'focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-1',
          ],
          disabled && 'opacity-70 cursor-default'
        )}
      >
        {renderBadge(value)}
      </button>

      {/* One-time-per-session "Click to edit" hint */}
      {hintVisible && !disabled && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 px-2 py-1 text-xs text-white bg-slate-800 rounded-md whitespace-nowrap pointer-events-none"
          role="tooltip"
        >
          Click to edit
        </div>
      )}
    </div>
  )
}
