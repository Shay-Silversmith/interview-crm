// ---------------------------------------------------------------------------
// InterviewFlow — ThemeProvider.tsx
// Light/dark/system theme: state, localStorage persistence, and <html class>
// sync. Mirrors I18nProvider so the two read the same way.
//
// The first paint is handled by an inline script in index.html, not here —
// React mounts too late to prevent a white flash on a dark-theme reload. This
// provider owns every change after that, and the two agree on the storage key
// and the resolution rule.
// ---------------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react'

/** What the user chose. 'system' defers to the OS setting, live. */
export type ThemePreference = 'light' | 'dark' | 'system'
/** What is actually on screen once 'system' is resolved. */
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'interviewflow_theme'

interface ThemeContextValue {
  /** The user's stored preference, including 'system'. */
  theme: ThemePreference
  /** The theme currently painted — never 'system'. */
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemePreference) => void
  /** Flips between light and dark, resolving 'system' to its opposite first. */
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // localStorage unavailable (private-browsing edge case)
  }
  return 'system'
}

function prefersDark(): boolean {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolve(theme: ThemePreference): ResolvedTheme {
  return theme === 'system' ? (prefersDark() ? 'dark' : 'light') : theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolve(getInitialTheme()))

  // Sync <html class="dark"> before the browser paints — no flicker on change.
  useLayoutEffect(() => {
    const next = resolve(theme)
    setResolvedTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }, [theme])

  // While on 'system', follow the OS if the user flips it mid-session.
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const next: ResolvedTheme = mq.matches ? 'dark' : 'light'
      setResolvedTheme(next)
      document.documentElement.classList.toggle('dark', next === 'dark')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Non-fatal: the theme still applies for this session.
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolve(theme) === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>')
  return ctx
}
