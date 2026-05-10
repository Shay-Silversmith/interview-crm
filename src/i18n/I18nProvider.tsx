// ---------------------------------------------------------------------------
// InterviewFlow i18n — I18nProvider.tsx
// Lightweight React context: locale state, localStorage persistence,
// <html> dir/lang sync, and a typed t() translation function.
// ---------------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Locale } from './types'
import en from './translations/en'
import he from './translations/he'

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
interface I18nContextValue {
  locale:    Locale
  setLocale: (locale: Locale) => void
  /** Resolve a dot-path key against the active dictionary with optional {{var}} interpolation. */
  t:         (key: string, vars?: Record<string, string | number>) => string
  /** Current document direction derived from locale. */
  dir:       'ltr' | 'rtl'
}

export const I18nContext = createContext<I18nContextValue | null>(null)

// ---------------------------------------------------------------------------
// Dictionaries map
// ---------------------------------------------------------------------------
const DICTS: Record<Locale, typeof en> = { en, he }

// ---------------------------------------------------------------------------
// Read the persisted locale once, synchronously, before first render.
// Falls back to 'en' so the initial paint is always deterministic.
// ---------------------------------------------------------------------------
function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem('interviewflow_locale')
    if (stored === 'he' || stored === 'en') return stored
  } catch {
    // localStorage unavailable (private-browsing edge case)
  }
  return 'en'
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  // Sync <html dir> and <html lang> before the browser paints — no flicker.
  useLayoutEffect(() => {
    document.documentElement.dir  = locale === 'he' ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    try {
      localStorage.setItem('interviewflow_locale', next)
    } catch {
      // ignore write errors
    }
    setLocaleState(next)
  }, [])

  // t() — walks dot-path on the active dictionary.
  // Falls back to en, then returns the raw key. Warns in dev when missing.
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const parts = key.split('.')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function resolve(dict: any): string | undefined {
        let node = dict
        for (const p of parts) node = node?.[p]
        return typeof node === 'string' ? node : undefined
      }

      const value = resolve(DICTS[locale]) ?? resolve(en)
      if (value === undefined) {
        if (import.meta.env.DEV) console.warn(`[i18n] Missing translation key: "${key}"`)
        return key
      }
      if (!vars) return value
      return value.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
        String(vars[k] ?? `{{${k}}}`),
      )
    },
    [locale],
  )

  const dir: 'ltr' | 'rtl' = locale === 'he' ? 'rtl' : 'ltr'

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Convenience hook (also re-exported via src/hooks/useI18n.ts)
// ---------------------------------------------------------------------------
export function useI18nContext(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
