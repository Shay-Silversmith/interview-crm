// ---------------------------------------------------------------------------
// ShortcutsModal — keyboard shortcut reference card (opened via ?)
// ---------------------------------------------------------------------------
import { Modal } from './Modal'

const GROUPS = [
  {
    label: 'Navigation',
    rows: [
      { keys: ['G', 'D'], desc: 'Dashboard' },
      { keys: ['G', 'A'], desc: 'Applications' },
      { keys: ['G', 'B'], desc: 'Board view' },
      { keys: ['G', 'T'], desc: 'Tasks' },
      { keys: ['G', 'C'], desc: 'Calendar' },
      { keys: ['G', 'P'], desc: 'Prep library' },
      { keys: ['G', 'I'], desc: 'AI tools' },
    ],
  },
  {
    label: 'Create',
    rows: [
      { keys: ['N', 'A'], desc: 'New application' },
      { keys: ['N', 'T'], desc: 'New task' },
    ],
  },
  {
    label: 'Global',
    rows: [
      { keys: ['⌘', 'K'], desc: 'Open search' },
      { keys: ['?'],       desc: 'Show this help' },
    ],
  },
]

interface ShortcutsModalProps {
  open:    boolean
  onClose: () => void
}

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" size="sm">
      <div className="space-y-5">
        {GROUPS.map(g => (
          <div key={g.label}>
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{g.label}</p>
            <div className="space-y-1.5">
              {g.rows.map(r => (
                <div key={r.desc} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{r.desc}</span>
                  <span className="flex items-center gap-1">
                    {r.keys.map((k, i) => (
                      <kbd key={i} className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 text-xs font-mono font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-md shadow-sm">
                        {k}
                      </kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
