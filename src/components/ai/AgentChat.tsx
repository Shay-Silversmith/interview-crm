// ---------------------------------------------------------------------------
// InterviewFlow — AgentChat.tsx
// Conversational AI agent that proposes typed CRM mutations the user can
// preview and apply. Lives as a slide-in drawer accessible from the Topbar.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Send, Sparkles, Check, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToastActions } from '@/hooks/useToast'
import { useI18n } from '@/hooks/useI18n'
import { useMockStore } from '@/hooks/useMockStore'
import { applicationsService } from '@/services/applicationsService'
import {
  planAgentActions,
  executeAgentActions,
  describeAction,
  type AgentMessage,
  type AgentPlan,
  type AgentAction,
  type ExecutionResult,
} from '@/services/agentService'
import { QK } from '@/lib/query-keys'
import { cn } from '@/lib/cn'

interface AgentChatProps {
  open:    boolean
  onClose: () => void
}

interface ChatEntry {
  id:      string
  role:    'user' | 'assistant'
  content: string
  /** When the assistant turn included a plan, this is it. */
  plan?:   AgentPlan
  /** Once the plan has been applied (or skipped), record the outcome. */
  results?: ExecutionResult[]
  /** Per-action selection in the preview UI; tracked here so it survives re-renders. */
  selected?: boolean[]
  /** Marks the plan as already-applied so the preview is locked. */
  appliedAt?: string
}

export function AgentChat({ open, onClose }: AgentChatProps) {
  const { locale } = useI18n()
  const t = locale === 'he'
  const toast = useToastActions()
  const queryClient = useQueryClient()
  const { data: applications } = useMockStore(
    () => applicationsService.list(),
    [],
    { key: QK.applications.all() }
  )

  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [executing, setExecuting] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries, thinking])

  // Auto-focus input when drawer opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  // Reset on close
  useEffect(() => {
    if (!open) {
      // small delay so the close animation looks clean before clearing state
      const t = setTimeout(() => { setEntries([]); setInput('') }, 300)
      return () => clearTimeout(t)
    }
  }, [open])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleSend() {
    const message = input.trim()
    if (!message || thinking) return

    const userEntry: ChatEntry = {
      id:      randomId(),
      role:    'user',
      content: message,
    }
    setEntries(prev => [...prev, userEntry])
    setInput('')
    setThinking(true)

    try {
      const history: AgentMessage[] = entries
        .filter(e => e.role === 'user' || e.role === 'assistant')
        .map(e => ({ role: e.role, content: e.content }))

      const plan = await planAgentActions(message, history, {
        today:        new Date().toISOString(),
        timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jerusalem',
        locale:       locale,
        applications: applications ?? [],
      })

      const assistantEntry: ChatEntry = {
        id:       randomId(),
        role:     'assistant',
        content:  plan.assistantMessage,
        plan,
        selected: plan.actions.map(() => true),
      }
      setEntries(prev => [...prev, assistantEntry])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setEntries(prev => [...prev, {
        id:      randomId(),
        role:    'assistant',
        content: t ? `הייתה שגיאה: ${msg}` : `Error: ${msg}`,
      }])
    } finally {
      setThinking(false)
    }
  }

  async function handleApply(entryId: string) {
    const entry = entries.find(e => e.id === entryId)
    if (!entry?.plan || !entry.selected) return

    const toRun: AgentAction[] = entry.plan.actions.filter((_, i) => entry.selected![i])
    if (toRun.length === 0) {
      toast.info(t ? 'לא נבחרו פעולות' : 'No actions selected')
      return
    }

    setExecuting(true)
    try {
      const results = await executeAgentActions(toRun, queryClient)
      setEntries(prev => prev.map(e =>
        e.id === entryId
          ? { ...e, results, appliedAt: new Date().toISOString() }
          : e
      ))
      const okCount  = results.filter(r => r.ok).length
      const failCount = results.length - okCount
      if (failCount === 0) toast.success(t ? `בוצעו ${okCount} פעולות` : `Applied ${okCount} actions`)
      else if (okCount === 0) toast.error(t ? `כל הפעולות נכשלו` : `All actions failed`)
      else toast.info(t ? `${okCount} בוצעו, ${failCount} נכשלו` : `${okCount} applied, ${failCount} failed`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Execution failed')
    } finally {
      setExecuting(false)
    }
  }

  function toggleAction(entryId: string, idx: number) {
    setEntries(prev => prev.map(e => {
      if (e.id !== entryId || !e.selected) return e
      const next = [...e.selected]
      next[idx] = !next[idx]
      return { ...e, selected: next }
    }))
  }

  function handleSkip(entryId: string) {
    setEntries(prev => prev.map(e =>
      e.id === entryId ? { ...e, appliedAt: new Date().toISOString(), results: [] } : e
    ))
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60]',
        open ? 'pointer-events-auto' : 'pointer-events-none'
      )}
      role="dialog"
      aria-modal="true"
      aria-label="AI Agent Chat"
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'absolute top-0 bottom-0 end-0 w-[480px] max-w-[95vw] bg-surface shadow-modal flex flex-col',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : (locale === 'he' ? '-translate-x-full' : 'translate-x-full'),
        )}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-gradient flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {t ? 'עוזר חכם' : 'AI Agent'}
              </div>
              <div className="text-2xs text-slate-500">
                {t ? 'תאר/י מה השתנה — אני אעדכן' : 'Describe what changed — I\'ll update'}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {entries.length === 0 && <Welcome locale={locale} />}

          {entries.map(entry => (
            <MessageBubble
              key={entry.id}
              entry={entry}
              locale={locale}
              executing={executing}
              onToggle={(idx) => toggleAction(entry.id, idx)}
              onApply={() => handleApply(entry.id)}
              onSkip={() => handleSkip(entry.id)}
            />
          ))}

          {thinking && (
            <div className="flex items-center gap-2 text-xs text-slate-500 ps-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {t ? 'מעבד…' : 'Thinking…'}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="p-3 border-t border-slate-100 shrink-0 bg-slate-50/60">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={2}
              placeholder={t
                ? 'למשל: עברתי שיחה ראשונית ב-MyHeritage, יש לי ראיון פיזי ביום ראשון'
                : 'e.g. Passed the phone screen at MyHeritage, on-site interview Sunday'}
              className="flex-1 resize-none rounded-lg border border-slate-200 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
              disabled={thinking}
            />
            <Button
              variant="primary"
              size="md"
              iconOnly
              onClick={handleSend}
              disabled={!input.trim() || thinking}
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-2xs text-slate-400 text-center">
            {t ? 'Enter לשליחה • Shift+Enter לשורה חדשה' : 'Enter to send • Shift+Enter for newline'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Welcome({ locale }: { locale: 'en' | 'he' }) {
  const t = locale === 'he'
  const examples = t
    ? [
        'עברתי שיחה ראשונית באמזון, יש לי תרגיל בית לעוד שבוע',
        'תוסיף משימה: לכתוב תודה למייקל מחברת Wix עד מחר',
        'דחיתי את הראיון ב-Mobileye מיום שלישי ליום חמישי 14:00',
      ]
    : [
        'Passed phone screen at Amazon, take-home assignment due in a week',
        'Add a task: send thank-you note to Michael at Wix by tomorrow',
        'Pushed the Mobileye interview from Tuesday to Thursday at 2pm',
      ]
  return (
    <div className="text-center px-4 py-6 space-y-4">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-gradient flex items-center justify-center text-white">
        <Sparkles className="w-7 h-7" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          {t ? 'תאר/י מה קרה — אני אעדכן את ה-CRM' : 'Describe what happened — I\'ll update your CRM'}
        </h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          {t
            ? 'אציע פעולות (עדכון שלב, הוספת ראיון, יצירת משימה) ותאשר/י לפני ביצוע.'
            : 'I\'ll propose actions (update stage, add interview, create task) and you confirm before applying.'}
        </p>
      </div>
      <div className="text-start space-y-1.5">
        <div className="text-2xs font-medium text-slate-500 uppercase tracking-wide">
          {t ? 'דוגמאות' : 'Examples'}
        </div>
        {examples.map((ex, i) => (
          <div key={i} className="text-xs text-slate-600 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
            "{ex}"
          </div>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({
  entry, locale, executing, onToggle, onApply, onSkip,
}: {
  entry:    ChatEntry
  locale:   'en' | 'he'
  executing: boolean
  onToggle: (idx: number) => void
  onApply:  () => void
  onSkip:   () => void
}) {
  const t = locale === 'he'
  const isUser = entry.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-3.5 py-2 rounded-2xl bg-primary-600 text-white text-sm whitespace-pre-wrap">
          {entry.content}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="max-w-[90%] px-3.5 py-2 rounded-2xl bg-slate-100 text-slate-800 text-sm whitespace-pre-wrap">
        {entry.content}
        {entry.plan?.isMock && (
          <span className="block mt-1 text-2xs text-slate-500 italic">
            {t ? '(תצוגת דמו — ללא AI חי)' : '(demo mode — no live AI)'}
          </span>
        )}
      </div>

      {entry.plan && entry.plan.actions.length > 0 && (
        <div className="ms-2 space-y-1.5 max-w-[95%]">
          <div className="text-2xs font-medium text-slate-500 uppercase tracking-wide">
            {entry.appliedAt
              ? (t ? 'תוצאה' : 'Result')
              : (t ? 'פעולות מוצעות' : 'Proposed actions')}
          </div>

          {entry.plan.actions.map((action, idx) => {
            const result = entry.results?.[idx]
            const isSelected = entry.selected?.[idx] ?? true
            const locked = !!entry.appliedAt

            return (
              <ActionCard
                key={idx}
                action={action}
                selected={isSelected}
                locked={locked}
                result={result}
                onToggle={() => onToggle(idx)}
              />
            )
          })}

          {!entry.appliedAt && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={onApply}
                loading={executing}
                disabled={executing || !(entry.selected?.some(Boolean))}
              >
                <Check className="w-3.5 h-3.5" />
                {t ? 'אישור וביצוע' : 'Apply'}
              </Button>
              <Button variant="ghost" size="sm" onClick={onSkip} disabled={executing}>
                {t ? 'דלג' : 'Skip'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ActionCard({
  action, selected, locked, result, onToggle,
}: {
  action:   AgentAction
  selected: boolean
  locked:   boolean
  result?:  ExecutionResult
  onToggle: () => void
}) {
  const text = describeAction(action)
  const status = result
    ? (result.ok ? 'success' : 'error')
    : (locked ? 'skipped' : (selected ? 'selected' : 'unselected'))

  return (
    <button
      type="button"
      onClick={locked ? undefined : onToggle}
      disabled={locked}
      className={cn(
        'w-full text-start flex items-start gap-2.5 px-3 py-2 rounded-lg border transition-colors',
        status === 'success'    && 'bg-success-50 border-success-200',
        status === 'error'      && 'bg-danger-50  border-danger-200',
        status === 'selected'   && 'bg-surface      border-primary-300 hover:border-primary-400',
        status === 'unselected' && 'bg-slate-50   border-slate-200    hover:border-slate-300 opacity-60',
        status === 'skipped'    && 'bg-slate-50   border-slate-200    opacity-50',
        !locked && 'cursor-pointer'
      )}
    >
      <div className="mt-0.5 shrink-0">
        {status === 'success' && <CheckCircle2 className="w-4 h-4 text-success-600" />}
        {status === 'error'   && <AlertCircle  className="w-4 h-4 text-danger-600" />}
        {status === 'selected' && (
          <div className="w-4 h-4 rounded border-2 border-primary-500 bg-primary-500 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {status === 'unselected' && (
          <div className="w-4 h-4 rounded border-2 border-slate-300 bg-surface" />
        )}
        {status === 'skipped' && (
          <div className="w-4 h-4 rounded border-2 border-slate-300 bg-slate-100" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-800 leading-relaxed break-words">
          <span className="text-2xs font-medium text-slate-500 uppercase me-1.5">
            {actionKindLabel(action.kind)}
          </span>
          {text}
        </div>
        {result?.error && (
          <div className="mt-1 text-2xs text-danger-700">{result.error}</div>
        )}
        {result?.ok && (
          <div className="mt-1 text-2xs text-success-700">{result.summary}</div>
        )}
      </div>
    </button>
  )
}

function actionKindLabel(kind: AgentAction['kind']): string {
  switch (kind) {
    case 'update_application':     return 'App'
    case 'create_interview_stage': return 'Round'
    case 'update_interview_stage': return 'Round'
    case 'create_task':            return 'Task'
    case 'create_calendar_event':  return 'Event'
  }
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10)
}
