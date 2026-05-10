// ---------------------------------------------------------------------------
// AIOutputRenderer — renders structured JSON from a live AI response.
// Handles string, string[], and STAR-story-object values generically.
// ---------------------------------------------------------------------------
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { StarStory } from '@/services/aiClientService'

type FieldValue = string | string[] | StarStory[]

interface AIOutputRendererProps {
  /** Key-value map of the AI response */
  data: Record<string, FieldValue>
  /** Label map — if omitted, keys are title-cased automatically */
  labels?: Record<string, string>
  className?: string
}

export function AIOutputRenderer({ data, labels, className }: AIOutputRendererProps) {
  const [copied, setCopied] = useState(false)

  const copyAll = () => {
    const text = Object.entries(data)
      .map(([k, v]) => {
        const label = labels?.[k] ?? toLabel(k)
        if (typeof v === 'string')       return `${label}\n${v}`
        if (isStarArray(v))              return `${label}\n${(v as StarStory[]).map(formatStar).join('\n\n')}`
        return `${label}\n${(v as string[]).map(s => `• ${s}`).join('\n')}`
      })
      .join('\n\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={className}>
      <div className="space-y-3 mb-4">
        {Object.entries(data).map(([key, value]) => (
          <FieldBlock key={key} label={labels?.[key] ?? toLabel(key)} value={value} />
        ))}
      </div>
      <div className="pt-3 border-t border-slate-100">
        <Button variant="outline" size="sm" onClick={copyAll}>
          {copied ? <Check className="w-3.5 h-3.5 text-success-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy All'}
        </Button>
      </div>
    </div>
  )
}

function FieldBlock({ label, value }: { label: string; value: FieldValue }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3">
      <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      {typeof value === 'string' ? (
        <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
      ) : isStarArray(value) ? (
        <div className="space-y-3">
          {(value as StarStory[]).map((s, i) => (
            <div key={i} className="text-sm text-slate-700 space-y-1">
              <p><span className="font-semibold text-slate-500">S:</span> {s.situation}</p>
              <p><span className="font-semibold text-slate-500">T:</span> {s.task}</p>
              <p><span className="font-semibold text-slate-500">A:</span> {s.action}</p>
              <p><span className="font-semibold text-slate-500">R:</span> {s.result}</p>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-1">
          {(value as string[]).map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-slate-300 mt-0.5 shrink-0">•</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Helpers

function isStarArray(v: FieldValue): boolean {
  return Array.isArray(v) && v.length > 0 && typeof (v[0] as unknown) === 'object'
}

function formatStar(s: StarStory): string {
  return `S: ${s.situation}\nT: ${s.task}\nA: ${s.action}\nR: ${s.result}`
}

function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, c => c.toUpperCase())
    .trim()
}
