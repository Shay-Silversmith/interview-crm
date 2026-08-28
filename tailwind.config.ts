import type { Config } from 'tailwindcss'

// ---------------------------------------------------------------------------
// InterviewFlow — Tailwind theme
//
// Every colour resolves through a CSS variable holding a bare "R G B" triplet,
// so a single `.dark` class on <html> re-themes the whole app without any page
// touching a `dark:` variant. The variables live in src/index.css.
//
// This works because the app uses the slate ramp consistently — low numbers are
// surfaces, high numbers are text. Dark mode inverts that ramp, so `bg-slate-50`
// stays "the quietest surface" and `text-slate-900` stays "the loudest text" in
// both themes. Adding a colour here means adding it to BOTH blocks in index.css.
//
// `white` is deliberately left as real white: it is used for text on coloured
// fills (`text-white` on the primary button) where it must not flip. Surfaces
// that used to be `bg-white` use `bg-surface` instead.
// ---------------------------------------------------------------------------

/** Builds a Tailwind colour that reads from a CSS variable and supports /opacity. */
const v = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`

const ramp = (prefix: string, stops: number[]) =>
  Object.fromEntries(stops.map(s => [s, v(`${prefix}-${s}`)]))

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Page and panel surfaces. `surface` replaces the old literal bg-white.
        surface: v('surface'),
        'surface-raised': v('surface-raised'),
        'surface-sunken': v('surface-sunken'),

        primary: ramp('primary', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        slate:   ramp('slate',   [50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        success: ramp('success', [50, 100, 200, 300, 400, 500, 600, 700, 800]),
        warning: ramp('warning', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        danger:  ramp('danger',  [50, 100, 200, 300, 400, 500, 600, 700, 800]),
        violet:  ramp('violet',  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
      },
      fontFamily: {
        // Plus Jakarta Sans carries the product voice — friendlier and more
        // distinctive than Inter, which stays as the metrics-compatible fallback.
        sans: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        // Numerals in stat tiles and score rings, where tabular alignment matters.
        num: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        // Display sizes for hero numbers and page titles.
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        // Elevation ramp. The dark theme cannot rely on black shadows the way
        // light can, so these read as near-invisible there and depth is carried
        // by the surface ramp and ring colours instead.
        card: '0 1px 3px 0 rgb(15 23 42 / 0.04), 0 1px 2px -1px rgb(15 23 42 / 0.04)',
        'card-hover': '0 8px 24px -8px rgb(15 23 42 / 0.12), 0 4px 8px -4px rgb(15 23 42 / 0.08)',
        lifted: '0 12px 32px -12px rgb(15 23 42 / 0.18), 0 4px 12px -6px rgb(15 23 42 / 0.10)',
        modal: '0 20px 60px 0 rgb(15 23 42 / 0.15), 0 8px 20px -4px rgb(15 23 42 / 0.10)',
        // Coloured glow for primary/AI affordances — the "tech" cue.
        glow: '0 0 0 1px rgb(var(--c-primary-500) / 0.18), 0 8px 28px -8px rgb(var(--c-primary-500) / 0.45)',
        'glow-violet': '0 0 0 1px rgb(var(--c-violet-500) / 0.18), 0 8px 28px -8px rgb(var(--c-violet-500) / 0.45)',
      },
      backgroundImage: {
        // Subtle violet→blue tint for AI surfaces — barely visible on first
        // glance but distinguishes AI cards from regular CRM cards.
        'ai-gradient': 'linear-gradient(135deg, rgb(var(--c-violet-500) / 0.08), rgb(var(--c-primary-500) / 0.06))',
        // Depth gradient for primary buttons.
        'primary-gradient': 'linear-gradient(180deg, rgb(var(--c-primary-fill-from)) 0%, rgb(var(--c-primary-fill-to)) 100%)',
        // Wide, soft brand wash for hero surfaces and the sidebar footer.
        'brand-mesh':
          'radial-gradient(60% 80% at 10% 0%, rgb(var(--c-primary-500) / 0.14) 0%, transparent 60%), radial-gradient(50% 70% at 90% 10%, rgb(var(--c-violet-500) / 0.12) 0%, transparent 55%)',
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      transitionTimingFunction: {
        // A gentle overshoot for elements entering the screen.
        entrance: 'cubic-bezier(0.34, 1.36, 0.64, 1)',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'shimmer':  'shimmer 2s linear infinite',
        // Entrance used by the stagger utility — see .stagger-children in index.css.
        'rise-in':  'riseIn 0.42s cubic-bezier(0.34, 1.36, 0.64, 1) both',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        riseIn: {
          from: { opacity: '0', transform: 'translateY(14px) scale(0.985)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
