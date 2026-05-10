// ---------------------------------------------------------------------------
// LanguageToggle — segmented EN | עב control for the Topbar.
// Compact height (h-7) so it fits neatly in the icon cluster.
// ---------------------------------------------------------------------------

import { cn } from '@/lib/cn'
import { useI18n } from '@/hooks/useI18n'
import type { Locale } from '@/i18n/types'

const OPTIONS: { locale: Locale; label: string }[] = [
  { locale: 'en', label: 'EN' },
  { locale: 'he', label: 'עב' },
]

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('topbar.language')}
      className="flex items-center h-7 bg-slate-100 rounded-lg p-0.5 gap-px"
    >
      {OPTIONS.map(({ locale: loc, label }) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          aria-pressed={locale === loc}
          className={cn(
            'h-6 px-2 rounded-md text-xs font-semibold transition-all duration-150 select-none',
            locale === loc
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
