// ---------------------------------------------------------------------------
// ThemeToggle — segmented Light | Dark | System control for the Topbar.
// Matches LanguageToggle's shape and height so the icon cluster stays even.
// ---------------------------------------------------------------------------

import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useTheme, type ThemePreference } from '@/theme/ThemeProvider'

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light',  label: 'Light',  Icon: Sun },
  { value: 'dark',   label: 'Dark',   Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex items-center h-7 bg-slate-100 rounded-lg p-0.5 gap-px"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          // The icon alone carries the meaning, so the button needs its own name.
          aria-label={label}
          title={label}
          className={cn(
            'h-6 w-7 inline-flex items-center justify-center rounded-md transition-all duration-150 select-none',
            theme === value
              ? 'bg-surface text-primary-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <Icon className="w-3.5 h-3.5" aria-hidden />
        </button>
      ))}
    </div>
  )
}
