// ---------------------------------------------------------------------------
// InterviewFlow i18n — types.ts
// Single source of type truth. Translations type is derived from the English
// dictionary so TypeScript enforces shape parity at compile time.
// ---------------------------------------------------------------------------

export type Locale = 'en' | 'he'

// Derived from the English dictionary — any mismatch in he.ts is a TS error.
export type Translations = typeof import('./translations/en').default
