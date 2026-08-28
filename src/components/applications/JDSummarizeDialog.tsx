// ---------------------------------------------------------------------------
// JDSummarizeDialog — modal that turns a pasted URL or text into a clean
// bullet summary via AI. The user reviews/edits the result, then chooses to
// replace or append the parent form's jobDescription field.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { Sparkles, Loader2, Link as LinkIcon, FileText } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToastActions } from '@/hooks/useToast'
import { aiService } from '@/services/aiService'
import { cn } from '@/lib/cn'
import { SampleOutputNotice } from '@/components/ai/SampleOutputNotice'
import type { FallbackReason } from '@/services/aiService'

interface JDSummarizeDialogProps {
  open:    boolean
  onClose: () => void
  /** Called with the chosen text when the user confirms the insert. */
  onInsert: (text: string, mode: 'replace' | 'append') => void
  /** Existing JD text — used to enable the "Append" option. */
  hasExisting?: boolean
}

type SourceTab = 'url' | 'text'

export function JDSummarizeDialog({ open, onClose, onInsert, hasExisting }: JDSummarizeDialogProps) {
  const toast = useToastActions()
  const [tab, setTab] = useState<SourceTab>('text')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [headline, setHeadline] = useState('')
  const [body, setBody] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [aiNotice, setAiNotice]     = useState<FallbackReason | null | undefined>(null)

  function reset() {
    setUrl(''); setText(''); setHeadline(''); setBody(''); setShowResult(false); setTab('text')
  }

  function handleClose() {
    if (busy) return
    reset()
    onClose()
  }

  async function handleSummarize() {
    if (busy) return
    if (tab === 'url' && !url.trim()) {
      toast.error('Paste a job posting URL first')
      return
    }
    if (tab === 'text' && !text.trim()) {
      toast.error('Paste the job description text first')
      return
    }
    setBusy(true)
    try {
      const { data, fromFallback, fallbackReason } = await aiService.summarizeJD(
        tab === 'url'
          ? { jdUrl: url.trim() }
          : { jdText: text.trim() }
      )
      // A canned summary inserted into a job description becomes part of the
      // record. Show the reason instead of a plausible paragraph.
      if (fromFallback) {
        setAiNotice(fallbackReason)
        setShowResult(false)
        return
      }
      setAiNotice(null)
      setHeadline(data.headline)
      setBody(data.bodyText)
      setShowResult(true)
      toast.success('Summary generated — review and edit before inserting')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Summarize failed')
    } finally {
      setBusy(false)
    }
  }

  function handleInsert(mode: 'replace' | 'append') {
    onInsert(body, mode)
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Summarize job description with AI" size="lg">
      <div className="space-y-4">
        {aiNotice !== null && <SampleOutputNotice reason={aiNotice} className="mb-3" />}

        {!showResult && (
          <>
            <p className="text-xs text-slate-500 leading-relaxed">
              Paste the job posting URL or its full text and we'll turn it into a clean bullet summary you can review before saving.
            </p>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
              <TabButton active={tab === 'text'} onClick={() => setTab('text')}>
                <FileText className="w-3.5 h-3.5" /> Paste text
              </TabButton>
              <TabButton active={tab === 'url'} onClick={() => setTab('url')}>
                <LinkIcon className="w-3.5 h-3.5" /> URL
              </TabButton>
            </div>

            {tab === 'url' ? (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Job posting URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://amazon.jobs/en/jobs/12345"
                  className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 force-ltr"
                />
                <p className="mt-1.5 text-2xs text-slate-400">
                  Some career sites block automated fetching; if the URL fails, paste the text instead.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Pasted JD text</label>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Paste the full job description here…"
                  rows={10}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-y"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={handleClose} disabled={busy}>Cancel</Button>
              <Button
                onClick={handleSummarize}
                loading={busy}
                disabled={busy || (tab === 'url' ? !url.trim() : !text.trim())}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {busy ? 'Summarising…' : 'Summarise with AI'}
              </Button>
            </div>
          </>
        )}

        {showResult && (
          <>
            <div className="rounded-lg bg-primary-50 border border-primary-200 px-3 py-2 text-xs">
              <p className="font-semibold text-primary-900 mb-0.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Generated summary
              </p>
              <p className="text-primary-800">{headline}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Edit before inserting
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-y font-mono"
              />
              <p className="mt-1.5 text-2xs text-slate-400">
                Edit anything you want — tweak bullets, remove fluff, add personal notes.
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setShowResult(false)} disabled={busy}>
                ← Back
              </Button>
              <div className="flex items-center gap-2">
                {hasExisting && (
                  <Button variant="outline" onClick={() => handleInsert('append')}>
                    Append to existing
                  </Button>
                )}
                <Button onClick={() => handleInsert('replace')}>
                  {hasExisting ? 'Replace JD' : 'Insert into JD'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-colors',
        active
          ? 'bg-surface text-slate-900 shadow-sm'
          : 'text-slate-500 hover:text-slate-700',
      )}
    >
      {children}
    </button>
  )
}
