// ---------------------------------------------------------------------------
// ThemesPreviewPage — visual comparison of 4 design directions for Wave 4.
// All variants render the SAME content (greeting + 3 stat chips + 3 app rows)
// so you can compare side-by-side and pick one before we apply it globally.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom'
import { ArrowLeft, Briefcase, Calendar, AlertTriangle, Sparkles, ChevronRight } from 'lucide-react'

// Sample content reused across all variants
const STATS = [
  { label: 'Active',   value: 5, icon: Briefcase },
  { label: 'Upcoming', value: 3, icon: Calendar },
  { label: 'Overdue',  value: 1, icon: AlertTriangle },
]
const APPS = [
  { company: 'Amazon',     role: 'Product Manager',       stage: 'HR Screen',           initial: 'A', color: 'bg-warning-100 text-warning-700' },
  { company: 'MyHeritage', role: 'Data Engineer',         stage: 'Technical Interview', initial: 'M', color: 'bg-success-100 text-success-700' },
  { company: 'Mobileye',   role: 'Software Engineer',     stage: 'Manager Interview',   initial: 'M', color: 'bg-primary-100 text-primary-700' },
]

export function ThemesPreviewPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        Back to dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Theme directions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Same dashboard, four visual treatments. Pick one and I'll apply it across the app.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThemeCard
          number={1}
          name="Linear / Vercel — minimalist"
          tags={['monochrome', 'tight type', 'calm']}
        >
          <MinimalVariant />
        </ThemeCard>

        <ThemeCard
          number={2}
          name="Dark — Linear-style"
          tags={['dark mode', 'violet accent', 'focus mode']}
        >
          <DarkVariant />
        </ThemeCard>

        <ThemeCard
          number={3}
          name="Notion / Soft — friendly"
          tags={['warm pastels', 'rounded', 'emoji-friendly']}
        >
          <NotionVariant />
        </ThemeCard>

        <ThemeCard
          number={4}
          name="Bold gradients — AI-native"
          tags={['vibrant', 'glass', 'modern']}
        >
          <BoldVariant />
        </ThemeCard>
      </div>

      <div className="mt-8 p-4 rounded-xl bg-primary-50 border border-primary-200 text-sm text-primary-900">
        Once you pick a direction, tell me <span className="font-bold">"go with #N"</span> and I'll apply it to the real Dashboard, Topbar, Sidebar, cards, badges, and forms. Reverting later is one PR.
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Wrapper card around each variant
// ---------------------------------------------------------------------------

function ThemeCard({
  number, name, tags, children,
}: { number: number; name: string; tags: string[]; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
            {number}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{name}</h3>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {tags.map(t => (
                <span key={t} className="text-2xs text-slate-500">· {t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Variant 1 — Linear / Vercel minimalist
// White bg, slate text, hairline borders, single primary accent
// ---------------------------------------------------------------------------

function MinimalVariant() {
  return (
    <div className="bg-slate-50 rounded-xl p-5 space-y-4 font-[Inter,sans-serif]">
      <div>
        <p className="text-2xs uppercase tracking-wide text-slate-400">Tuesday, May 12</p>
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Good morning, Maya.</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {STATS.map(s => (
          <div key={s.label} className="bg-white rounded-md border border-slate-200 px-3 py-2.5">
            <p className="text-2xs uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className="text-2xl font-semibold text-slate-900 leading-none mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-md border border-slate-200 divide-y divide-slate-100">
        {APPS.map(a => (
          <div key={a.company} className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-6 h-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-medium">
              {a.initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900">{a.role}</p>
              <p className="text-2xs text-slate-500">{a.company}</p>
            </div>
            <span className="text-2xs text-slate-500">{a.stage}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </div>
        ))}
      </div>

      <button className="text-xs font-medium text-blue-600 hover:text-blue-700">View all →</button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Variant 2 — Dark mode Linear style
// Slate-950 bg, slate-900 cards, violet accent
// ---------------------------------------------------------------------------

function DarkVariant() {
  return (
    <div className="bg-slate-950 rounded-xl p-5 space-y-4">
      <div>
        <p className="text-2xs uppercase tracking-wide text-slate-500">Tuesday, May 12</p>
        <h2 className="text-xl font-semibold text-white tracking-tight">Good morning, Maya.</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {STATS.map((s, i) => (
          <div key={s.label} className="bg-slate-900 rounded-lg border border-slate-800 px-3 py-2.5">
            <p className="text-2xs uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className={`text-2xl font-semibold leading-none mt-1 ${
              i === 2 ? 'text-rose-400' : 'text-white'
            }`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-lg border border-slate-800 divide-y divide-slate-800">
        {APPS.map(a => (
          <div key={a.company} className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-6 h-6 rounded bg-violet-500/20 text-violet-300 flex items-center justify-center text-xs font-medium border border-violet-500/30">
              {a.initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white">{a.role}</p>
              <p className="text-2xs text-slate-500">{a.company}</p>
            </div>
            <span className="text-2xs text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded">{a.stage}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          </div>
        ))}
      </div>

      <button className="text-xs font-medium text-violet-300 hover:text-violet-200">View all →</button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Variant 3 — Notion / Soft pastels
// Warm cream bg, rounded-2xl, pastel chips, friendly icons
// ---------------------------------------------------------------------------

function NotionVariant() {
  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: '#faf8f4' }}>
      <div className="flex items-center gap-2">
        <span className="text-xl">🌿</span>
        <div>
          <p className="text-2xs uppercase tracking-wide text-stone-500">Tuesday, May 12</p>
          <h2 className="text-xl font-semibold text-stone-800">Good morning, Maya</h2>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {STATS.map((s, i) => {
          const colors = [
            'bg-emerald-50 text-emerald-700 border-emerald-100',
            'bg-amber-50 text-amber-700 border-amber-100',
            'bg-rose-50 text-rose-700 border-rose-100',
          ][i]
          const emoji = ['💼', '📅', '🔥'][i]
          return (
            <div key={s.label} className={`rounded-2xl border px-3 py-3 ${colors}`}>
              <div className="text-base mb-0.5">{emoji}</div>
              <p className="text-2xl font-bold leading-none">{s.value}</p>
              <p className="text-2xs mt-1 opacity-80">{s.label}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {APPS.map((a, i) => (
          <div key={a.company} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-stone-100' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-semibold ${a.color}`}>
              {a.initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800">▸ {a.role}</p>
              <p className="text-xs text-stone-500">{a.company}</p>
            </div>
            <span className="text-2xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full">{a.stage}</span>
          </div>
        ))}
      </div>

      <button className="text-xs font-medium text-emerald-700 hover:text-emerald-800">See all applications →</button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Variant 4 — Bold gradients / AI-native
// Gradient bg, glass cards with backdrop-blur, big stat numbers
// ---------------------------------------------------------------------------

function BoldVariant() {
  return (
    <div
      className="rounded-xl p-5 space-y-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #1e3a8a 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-fuchsia-500/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

      <div className="relative flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-fuchsia-300" />
        <p className="text-2xs uppercase tracking-wide text-white/60">Tuesday, May 12</p>
      </div>
      <h2 className="relative text-2xl font-bold text-white tracking-tight">
        Good morning, Maya.
      </h2>

      <div className="relative grid grid-cols-3 gap-3">
        {STATS.map(s => (
          <div
            key={s.label}
            className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 px-3 py-3 hover:bg-white/15 transition-colors"
          >
            <p className="text-2xs uppercase tracking-wider text-white/60">{s.label}</p>
            <p className="text-3xl font-bold text-white leading-none mt-1 bg-gradient-to-br from-white to-white/70 bg-clip-text">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="relative bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
        {APPS.map((a, i) => (
          <div
            key={a.company}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-white/5 ${i > 0 ? 'border-t border-white/10' : ''}`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
              {a.initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{a.role}</p>
              <p className="text-2xs text-white/60">{a.company}</p>
            </div>
            <span className="text-2xs text-white/90 bg-gradient-to-r from-fuchsia-500/30 to-cyan-500/30 border border-white/20 px-2 py-1 rounded-full backdrop-blur">
              {a.stage}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-white/40" />
          </div>
        ))}
      </div>

      <button className="relative text-xs font-medium text-fuchsia-200 hover:text-white">View all →</button>
    </div>
  )
}
