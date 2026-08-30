// ---------------------------------------------------------------------------
// FollowUpPanel — three drafts of one follow-up message.
//
// The contact picker used to filter on `contact.applicationIds`, which is the
// one link most contacts do not have: people are saved against a company, and
// only get tied to a specific application if the user goes back and does it by
// hand. So picking an application emptied the list. Matching now walks company
// id, then company name, then the application link, and anything unmatched is
// still reachable in a second group rather than hidden.
// ---------------------------------------------------------------------------
import { useMemo, useState } from 'react'
import { Sparkles, MessageSquarePlus, AlertCircle, Copy, Check, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useMockStore } from '@/hooks/useMockStore'
import { useCandidate } from '@/hooks/useCandidate'
import { useToastActions } from '@/hooks/useToast'
import { useI18n } from '@/hooks/useI18n'
import { applicationsService } from '@/services/applicationsService'
import { contactsService } from '@/services/contactsService'
import { aiService, type AIRun } from '@/services/aiService'
import { AppSelector } from './AppSelector'
import { AIFailureNotice } from './AIFailureNotice'
import { PanelEmpty, PanelLoading, ToolIntro } from './ResultBlocks'
import { cn } from '@/lib/cn'
import type { Contact, JobApplication } from '@/types'
import type { FollowUpResponse, MessageType, Tone } from '@/services/aiClientService'

type OutputTab = 'short' | 'warm' | 'linkedIn'

type RunState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done';  data: FollowUpResponse }
  | { status: 'error'; run: Extract<AIRun<never>, { ok: false }> }

/**
 * Contacts that plausibly belong to this application, most-specific first.
 * Returns every contact split into matched and other, never a filtered-away
 * empty list — a picker with nothing in it reads as a broken feature.
 */
function partitionContacts(
  contacts: Contact[],
  app: JobApplication | undefined,
): { matched: Contact[]; other: Contact[] } {
  if (!app) return { matched: [], other: contacts }

  const companyName = app.companyName.trim().toLowerCase()

  const matched = contacts.filter(c =>
    c.applicationIds?.includes(app.id) ||
    (!!c.companyId && c.companyId === app.companyId) ||
    (!!c.company && c.company.trim().toLowerCase() === companyName),
  )
  const matchedIds = new Set(matched.map(c => c.id))

  return { matched, other: contacts.filter(c => !matchedIds.has(c.id)) }
}

export function FollowUpPanel() {
  const toast = useToastActions()
  const { t, locale } = useI18n()
  const { candidate } = useCandidate()
  const { data: applications } = useMockStore(() => applicationsService.list())
  const { data: allContacts }  = useMockStore(() => contactsService.list())

  const MESSAGE_TYPES: { value: MessageType; label: string }[] = [
    { value: 'post-interview',     label: t('forms.options.msgPostInterview') },
    { value: 'ping-after-silence', label: t('forms.options.msgPingAfterSilence') },
    { value: 'thank-you',          label: t('forms.options.msgThankYou') },
    { value: 'decline-politely',   label: t('forms.options.msgDeclinePolitely') },
  ]

  const TONES: { value: Tone; label: string }[] = [
    { value: 'professional', label: t('forms.options.toneProfessional') },
    { value: 'warm',         label: t('forms.options.toneWarm') },
    { value: 'casual',       label: t('forms.options.toneCasual') },
  ]

  const TAB_META: { id: OutputTab; label: string; subtitle: string; charLimit?: number }[] = [
    { id: 'short',    label: t('ai.followUp.tabShort'),    subtitle: t('ai.followUp.subtitleShort') },
    { id: 'warm',     label: t('ai.followUp.tabWarm'),     subtitle: t('ai.followUp.subtitleWarm') },
    { id: 'linkedIn', label: t('ai.followUp.tabLinkedIn'), subtitle: t('ai.followUp.subtitleLinkedIn'), charLimit: 300 },
  ]

  const [selectedAppId,   setSelectedAppId]   = useState('')
  const [selectedContact, setSelectedContact] = useState('')
  const [messageType,     setMessageType]     = useState<MessageType>('post-interview')
  const [tone,            setTone]            = useState<Tone>('professional')
  const [context,         setContext]         = useState('')
  const [activeTab,       setActiveTab]       = useState<OutputTab>('short')
  const [copiedTab,       setCopiedTab]       = useState<OutputTab | null>(null)
  const [state,           setState]           = useState<RunState>({ status: 'idle' })

  const selectedApp = applications?.find(a => a.id === selectedAppId)

  const { matched, other } = useMemo(
    () => partitionContacts(allContacts ?? [], selectedApp),
    [allContacts, selectedApp],
  )

  const contact = allContacts?.find(c => c.id === selectedContact)

  const handleAppSelect = (appId: string) => {
    setSelectedAppId(appId)
    // Keep a contact that still belongs to the newly-picked application.
    const app = applications?.find(a => a.id === appId)
    const stillValid = partitionContacts(allContacts ?? [], app)
      .matched.some(c => c.id === selectedContact)
    if (!stillValid) setSelectedContact('')
  }

  const canGenerate = !!selectedApp

  const handleGenerate = async () => {
    if (!selectedApp) return
    setState({ status: 'loading' })

    const res = await aiService.generateFollowUps({
      messageType,
      company:      selectedApp.companyName,
      contactName:  contact?.name ?? 'Hiring Team',
      contactTitle: contact?.title,
      role:         selectedApp.roleName,
      tone,
      context:      context.trim(),
      candidate,
      locale:       locale as 'en' | 'he',
    })

    if (!res.ok) {
      setState({ status: 'error', run: res })
      return
    }
    setState({ status: 'done', data: res.data })
    setActiveTab('short')
  }

  const handleCopy = (tab: OutputTab) => {
    if (state.status !== 'done') return
    const body = state.data[tab]
    // The subject belongs with the email variants, not the LinkedIn one.
    const text = tab === 'linkedIn' || !state.data.subject
      ? body
      : `Subject: ${state.data.subject}\n\n${body}`

    navigator.clipboard.writeText(text).then(() => {
      setCopiedTab(tab)
      toast.success(t('ai.toasts.copiedToClipboard'))
      setTimeout(() => setCopiedTab(null), 2000)
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ── Input ── */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center border bg-slate-50 border-slate-200 text-slate-700">
            <MessageSquarePlus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{t('ai.followUp.title')}</h2>
            <p className="text-xs text-slate-500">{t('ai.followUp.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <ToolIntro
            what={t('ai.followUp.introWhat')}
            how={[
              t('ai.followUp.introStep1'),
              t('ai.followUp.introStep2'),
              t('ai.followUp.introStep3'),
            ]}
          />

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.followUp.msgTypeLabel')}
            </label>
            <select
              value={messageType}
              onChange={e => setMessageType(e.target.value as MessageType)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              {MESSAGE_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <AppSelector
            applications={applications ?? []}
            value={selectedAppId}
            onChange={handleAppSelect}
            label={t('ai.followUp.appLabel')}
            required
            placeholder={t('ai.followUp.appPlaceholder')}
          />

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.followUp.contactLabel')}{' '}
              <span className="text-slate-400">({t('ai.jdParser.optional')})</span>
            </label>
            <select
              value={selectedContact}
              onChange={e => setSelectedContact(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">{t('ai.followUp.contactPlaceholder')}</option>

              {matched.length > 0 && (
                <optgroup label={selectedApp ? `${selectedApp.companyName}` : t('ai.followUp.contactMatched')}>
                  {matched.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.title ? ` — ${c.title}` : ''}
                    </option>
                  ))}
                </optgroup>
              )}

              {other.length > 0 && (
                <optgroup label={t('ai.followUp.contactOther')}>
                  {other.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.company ? ` — ${c.company}` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {selectedApp && matched.length === 0 && (
              <p className="text-2xs text-slate-400 mt-1 flex items-center gap-1">
                <UserPlus className="w-3 h-3" />
                {t('ai.followUp.noContactsForCompany')}{' '}
                <Link to="/contacts" className="underline hover:no-underline">
                  {t('ai.followUp.addContact')}
                </Link>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.followUp.toneLabel')}
            </label>
            <div className="flex gap-2">
              {TONES.map(tn => (
                <button
                  key={tn.value}
                  onClick={() => setTone(tn.value)}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    tone === tn.value
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-surface text-slate-600 border-slate-200 hover:border-slate-300',
                  )}
                >
                  {tn.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.followUp.contextLabel')}{' '}
              <span className="text-slate-400">({t('ai.jdParser.optional')})</span>
            </label>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              dir="auto"
              rows={3}
              placeholder={t('ai.followUp.contextPlaceholder')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
            />
            <p className="text-2xs text-slate-400 mt-1">{t('ai.followUp.contextHint')}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <Button
            className="w-full"
            onClick={handleGenerate}
            loading={state.status === 'loading'}
            disabled={!canGenerate}
          >
            <Sparkles className="w-4 h-4" />
            {state.status === 'loading' ? t('ai.followUp.drafting') : t('ai.followUp.generateButton')}
          </Button>
        </div>
      </Card>

      {/* ── Output ── */}
      <Card className="flex flex-col">
        {state.status === 'idle' && (
          <PanelEmpty
            icon={MessageSquarePlus}
            title={t('ai.followUp.emptyTitle')}
            sub={t('ai.followUp.emptySub')}
          />
        )}

        {state.status === 'loading' && <PanelLoading label={t('ai.followUp.draftingState')} />}

        {state.status === 'error' && (
          <AIFailureNotice
            reason={state.run.reason}
            message={state.run.message}
            onRetry={handleGenerate}
          />
        )}

        {state.status === 'done' && (
          <div className="flex flex-col gap-3 flex-1">
            {state.data.subject && (
              <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                <p className="text-2xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
                  {t('ai.followUp.subject')}
                </p>
                <p dir="auto" className="text-sm text-slate-700">{state.data.subject}</p>
              </div>
            )}

            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              {TAB_META.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all',
                    activeTab === tab.id
                      ? 'bg-surface text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {TAB_META.map(tab => activeTab === tab.id && (
              <MessagePane
                key={tab.id}
                subtitle={tab.subtitle}
                content={state.data[tab.id]}
                charLimit={tab.charLimit}
                copied={copiedTab === tab.id}
                onCopy={() => handleCopy(tab.id)}
                overLimitLabel={t('ai.followUp.overLimit')}
                copyLabel={t('ai.followUp.copy')}
                copiedLabel={t('ai.followUp.copied')}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function MessagePane({
  subtitle, content, charLimit, copied, onCopy, overLimitLabel, copyLabel, copiedLabel,
}: {
  subtitle: string
  content: string
  charLimit?: number
  copied: boolean
  onCopy: () => void
  overLimitLabel: string
  copyLabel: string
  copiedLabel: string
}) {
  const overLimit = charLimit !== undefined && content.length > charLimit

  return (
    <div className="flex flex-col flex-1 rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-2xs text-slate-400">{subtitle}</p>
        <div className="flex items-center gap-2">
          {charLimit !== undefined && (
            <span className={cn('text-2xs font-medium', overLimit ? 'text-danger-500' : 'text-slate-400')}>
              {content.length}/{charLimit}
            </span>
          )}
          {overLimit && (
            <span className="flex items-center gap-1 text-2xs text-danger-500">
              <AlertCircle className="w-3 h-3" />
              {overLimitLabel}
            </span>
          )}
        </div>
      </div>
      <p dir="auto" className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap flex-1">
        {content}
      </p>
      <div className="mt-3 pt-3 border-t border-slate-100">
        <Button variant="outline" size="sm" onClick={onCopy}>
          {copied ? <Check className="w-3.5 h-3.5 text-success-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
    </div>
  )
}
