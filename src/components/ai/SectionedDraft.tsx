// ---------------------------------------------------------------------------
// SectionedDraft — renders an AI result object as editable labeled sections.
// Sections cascade in 200ms apart (cheap streaming feel).
// The parent holds draftData; SectionedDraft calls onFieldSave to update it.
// ---------------------------------------------------------------------------
import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EditableField, type FieldValue } from './EditableField'
import { useI18n } from '@/hooks/useI18n'
import type { StarStory } from '@/services/aiClientService'

interface SectionedDraftProps {
  /** Full AI response object — keys are rendered as sections. */
  data: Record<string, FieldValue>
  /** Human-readable label map. Missing keys are auto-labeled from camelCase. */
  labels?: Record<string, string>
  /** Called when the user saves an individual field. Parent merges into draftData. */
  onFieldSave: (key: string, value: FieldValue) => void
  /** Show stagger animation on first render (set to false to disable). */
  stagger?: boolean
}

function toLabel(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim()
}

function fieldToText(v: FieldValue): string {
  if (typeof v === 'string') return v
  if (Array.isArray(v) && v.length > 0 && typeof (v[0] as unknown) === 'object') {
    return (v as StarStory[]).map(s => `S: ${s.situation}\nT: ${s.task}\nA: ${s.action}\nR: ${s.result}`).join('\n\n')
  }
  return (v as string[]).map(s => `• ${s}`).join('\n')
}

export function SectionedDraft({
  data,
  labels,
  onFieldSave,
  stagger = true,
}: SectionedDraftProps) {
  const { t } = useI18n()
  const entries = Object.entries(data)
  const [visibleCount, setVisibleCount] = useState(stagger ? 0 : entries.length)
  const [copied, setCopied]             = useState(false)

  // Stagger reveal: one section every 200ms
  useEffect(() => {
    if (!stagger) { setVisibleCount(entries.length); return }
    setVisibleCount(0)
    const timers: ReturnType<typeof setTimeout>[] = []
    entries.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(c => Math.max(c, i + 1)), (i + 1) * 200))
    })
    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // runs once on mount — parent remounts with a key to reset

  const copyAll = () => {
    const text = entries
      .map(([k, v]) => `${labels?.[k] ?? toLabel(k)}\n${fieldToText(v)}`)
      .join('\n\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div>
      <div className="space-y-3 mb-4">
        {entries.map(([key, value], i) => (
          <EditableField
            key={key}
            label={labels?.[key] ?? toLabel(key)}
            value={value}
            onSave={newVal => onFieldSave(key, newVal)}
            visible={i < visibleCount}
          />
        ))}
      </div>
      {/* Show copy button only when all sections are visible */}
      {visibleCount >= entries.length && (
        <div className="pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={copyAll}>
            {copied ? <Check className="w-3.5 h-3.5 text-success-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t('ai.copied') : t('ai.copyAll')}
          </Button>
        </div>
      )}
    </div>
  )
}
