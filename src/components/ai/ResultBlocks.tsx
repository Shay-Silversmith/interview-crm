// ---------------------------------------------------------------------------
// InterviewFlow — ResultBlocks.tsx
// Presentation primitives shared by every AI result panel.
//
// The six tools produce different data but the same handful of shapes: a prose
// paragraph, a list, a labelled chip row, a source list. Writing those once
// keeps the panels readable and stops each tool from inventing its own visual
// language for "here is a list of things".
// ---------------------------------------------------------------------------

import { useState, type ReactNode } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { GroundingSource } from '@/services/aiClientService'

// ---------------------------------------------------------------------------

export function Section({
  title,
  hint,
  children,
  className,
}: {
  title: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
        {hint && <span className="text-2xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <p dir="auto" className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
      {children}
    </p>
  )
}

/** Renders nothing at all when the list is empty — an empty heading is noise. */
export function BulletList({
  title,
  items,
  hint,
  ordered = false,
}: {
  title: string
  items?: string[]
  hint?: string
  ordered?: boolean
}) {
  if (!items || items.length === 0) return null
  const List = ordered ? 'ol' : 'ul'

  return (
    <Section title={title} hint={hint}>
      <List className={cn('space-y-1.5', ordered && 'list-decimal ps-4')}>
        {items.map((item, i) => (
          <li key={i} dir="auto" className="text-sm leading-relaxed text-slate-700 flex gap-2">
            {!ordered && <span className="text-slate-300 select-none shrink-0">•</span>}
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </List>
    </Section>
  )
}

export function ChipRow({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <Section title={title}>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            dir="auto"
            className="text-2xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-lg"
          >
            {item}
          </span>
        ))}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------

export function CopyButton({
  text,
  label = 'Copy',
  className,
}: {
  text: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handle}
      className={cn(
        'inline-flex items-center gap-1.5 text-2xs font-medium rounded-lg border px-2 py-1 transition-colors',
        copied
          ? 'border-success-200 bg-success-50 text-success-700'
          : 'border-slate-200 text-slate-600 hover:bg-slate-50',
        className,
      )}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : label}
    </button>
  )
}

// ---------------------------------------------------------------------------

/**
 * Where the research came from. Grounded output without visible sources asks
 * the reader to trust a claim they cannot check — which is the whole failure
 * mode these tools exist to avoid.
 */
export function SourceList({ sources }: { sources?: GroundingSource[] }) {
  if (!sources || sources.length === 0) return null

  return (
    <Section title="Sources" hint={`${sources.length} consulted`}>
      <ul className="space-y-1">
        {sources.map((s, i) => (
          <li key={i} className="min-w-0">
            <a
              href={s.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline break-all"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span className="truncate">{s.title || s.uri}</span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}

// ---------------------------------------------------------------------------

export function PanelEmpty({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ElementType
  title: string
  sub: string
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-64 text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-slate-300" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{sub}</p>
    </div>
  )
}

export function PanelLoading({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-64 text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mb-3 animate-pulse">
        <div className="w-5 h-5 rounded-full border-2 border-primary-300 border-t-primary-600 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1 max-w-xs">{sub}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------

/** Explains what a tool is for, in the panel, before the first run. */
export function ToolIntro({
  what,
  how,
  needs,
}: {
  what: string
  how: string[]
  needs?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 space-y-2">
      <p dir="auto" className="text-xs text-slate-600 leading-relaxed">{what}</p>
      <ol className="space-y-1">
        {how.map((step, i) => (
          <li key={i} dir="auto" className="text-2xs text-slate-500 flex gap-2 leading-relaxed">
            <span className="font-bold text-slate-400 shrink-0">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {needs && (
        <p dir="auto" className="text-2xs text-slate-400 border-t border-slate-200 pt-2">{needs}</p>
      )}
    </div>
  )
}
