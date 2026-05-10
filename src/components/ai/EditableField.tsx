// ---------------------------------------------------------------------------
// EditableField — a single labeled AI output field with inline editing.
// Clicking the pencil flips to a Textarea; Save/Cancel return to read mode.
// Supports string values and string[] values (joined/split on newlines).
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { StarStory } from '@/services/aiClientService'

export type FieldValue = string | string[] | StarStory[]

interface EditableFieldProps {
  label: string
  value: FieldValue
  onSave: (newValue: FieldValue) => void
  /** Drives the stagger-reveal animation — field is invisible until true. */
  visible?: boolean
}

function isStarArray(v: FieldValue): v is StarStory[] {
  return Array.isArray(v) && v.length > 0 && typeof (v[0] as unknown) === 'object'
}

export function EditableField({ label, value, onSave, visible = true }: EditableFieldProps) {
  const [editing, setEditing]  = useState(false)
  const [draft, setDraft]      = useState('')

  const startEdit = () => {
    if (isStarArray(value)) return // star stories are read-only in this UI
    const initial = Array.isArray(value) ? (value as string[]).join('\n') : (value as string)
    setDraft(initial)
    setEditing(true)
  }

  const handleSave = () => {
    const original = Array.isArray(value) && !isStarArray(value)
    const saved: FieldValue = original
      ? draft.split('\n').map(s => s.trim()).filter(Boolean)
      : draft
    onSave(saved)
    setEditing(false)
  }

  const handleCancel = () => setEditing(false)

  return (
    <div
      className={cn(
        'rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3 transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      )}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        {!isStarArray(value) && !editing && (
          <button
            onClick={startEdit}
            className="p-1 rounded hover:bg-slate-200 text-slate-300 hover:text-slate-500 transition-colors"
            aria-label={`Edit ${label}`}
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            dir="auto"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={Array.isArray(value) ? Math.max(3, (value as string[]).length + 1) : 4}
            className="w-full px-3 py-2 rounded-lg border border-primary-300 bg-white text-sm text-slate-800 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1 text-xs font-medium text-success-700 bg-success-50 hover:bg-success-100 border border-success-200 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Check className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
            {Array.isArray(value) && (
              <span className="text-2xs text-slate-400 ml-auto">One item per line</span>
            )}
          </div>
        </div>
      ) : (
        <ReadView value={value} />
      )}
    </div>
  )
}

function ReadView({ value }: { value: FieldValue }) {
  // dir="auto" lets the browser infer text direction per paragraph/item.
  // This is essential for Hebrew output where technical terms stay in English —
  // the browser will set RTL for Hebrew-majority text and LTR for inline code
  // snippets without needing explicit bidi markup on every run.
  if (typeof value === 'string') {
    return <p dir="auto" className="text-sm text-slate-700 leading-relaxed">{value}</p>
  }
  if (isStarArray(value)) {
    return (
      <div className="space-y-3">
        {(value as StarStory[]).map((s, i) => (
          <div key={i} className="text-sm text-slate-700 space-y-1">
            <p dir="auto"><span className="font-semibold text-slate-500">S:</span> {s.situation}</p>
            <p dir="auto"><span className="font-semibold text-slate-500">T:</span> {s.task}</p>
            <p dir="auto"><span className="font-semibold text-slate-500">A:</span> {s.action}</p>
            <p dir="auto"><span className="font-semibold text-slate-500">R:</span> {s.result}</p>
          </div>
        ))}
      </div>
    )
  }
  return (
    <ul className="space-y-1">
      {(value as string[]).map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
          <span className="text-slate-300 mt-0.5 shrink-0">•</span>
          <span dir="auto" className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}
