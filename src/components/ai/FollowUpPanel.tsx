// ---------------------------------------------------------------------------
// FollowUpPanel — generate 3 follow-up message variants.
// Application selector pre-fills company + role; contact selector fills name.
// Output: Short / Warm / LinkedIn tabs, each with a Copy button.
// No Save — copy is the action.
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { Sparkles, MessageSquarePlus, AlertCircle, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useMockStore } from '@/hooks/useMockStore'
import { useToastActions } from '@/hooks/useToast'
import { useI18n } from '@/hooks/useI18n'
import { applicationsService } from '@/services/applicationsService'
import { contactsService } from '@/services/contactsService'
import { aiService } from '@/services/aiService'
import { AppSelector } from './AppSelector'
import type { FollowUpResponse, MessageType, Tone } from '@/services/aiClientService'
import { cn } from '@/lib/cn'

type OutputTab = 'short' | 'warm' | 'linkedIn'

export function FollowUpPanel() {
  const toast = useToastActions()
  const { t, locale } = useI18n()
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
  const [loading,         setLoading]         = useState(false)
  const [result,          setResult]          = useState<FollowUpResponse | null>(null)
  const [activeTab,       setActiveTab]       = useState<OutputTab>('short')
  const [copiedTab,       setCopiedTab]       = useState<OutputTab | null>(null)

  const selectedApp = applications?.find(a => a.id === selectedAppId)

  // Filter contacts: prefer those linked to the selected application
  const relevantContacts = allContacts
    ? selectedAppId
      ? allContacts.filter(c => c.applicationIds.includes(selectedAppId))
      : allContacts
    : []

  const contactName = allContacts?.find(c => c.id === selectedContact)?.name ?? ''

  const handleAppSelect = (appId: string) => {
    setSelectedAppId(appId)
    setSelectedContact('') // reset contact when app changes
  }

  const canGenerate = !!selectedApp

  const handleGenerate = async () => {
    if (!selectedApp) return
    setLoading(true)
    setResult(null)

    const res = await aiService.generateFollowUps({
      messageType,
      company:     selectedApp.companyName,
      contactName: contactName || 'Hiring Team',
      role:        selectedApp.roleName,
      tone,
      context:     context.trim(),
    }, locale as 'en' | 'he' | undefined)

    setLoading(false)

    if (res.fromFallback) {
      switch (res.fallbackReason) {
        case 'disabled':
          toast.info(t('ai.toasts.disabledFollowUp'))
          break
        case 'rate-limited':
          toast.error(t('ai.toasts.rateLimitedOnly'))
          break
        case 'validation-error':
          toast.info(t('ai.toasts.validationFallbackGeneric'))
          if (import.meta.env.DEV) console.warn('[FollowUp] Validation fallback:', res)
          break
        default:
          toast.info(t('ai.toasts.unreachable'))
      }
    }

    setResult(res.data)
    setActiveTab('short')
  }

  const handleCopy = (tab: OutputTab) => {
    if (!result) return
    navigator.clipboard.writeText(result[tab]).then(() => {
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
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t('ai.followUp.msgTypeLabel')}</label>
            <select
              value={messageType}
              onChange={e => setMessageType(e.target.value as MessageType)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
            >
              {MESSAGE_TYPES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
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

          {/* Contact selector — only shown when an app is selected */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.followUp.contactLabel')} <span className="text-slate-400">({t('ai.jdParser.optional')})</span>
            </label>
            <select
              value={selectedContact}
              onChange={e => setSelectedContact(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
              disabled={!selectedAppId}
            >
              <option value="">{t('ai.followUp.contactPlaceholder')}</option>
              {relevantContacts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.title ? ` — ${c.title}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Tone toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t('ai.followUp.toneLabel')}</label>
            <div className="flex gap-2">
              {TONES.map(tn => (
                <button
                  key={tn.value}
                  onClick={() => setTone(tn.value)}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    tone === tn.value
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  )}
                >
                  {tn.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.followUp.contextLabel')} <span className="text-slate-400">({t('ai.jdParser.optional')})</span>
            </label>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="e.g. Met at career fair, completed technical interview last Thursday, waiting on feedback…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 resize-none"
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <Button className="w-full" onClick={handleGenerate} loading={loading} disabled={!canGenerate}>
            <Sparkles className="w-4 h-4" />
            {loading ? t('ai.followUp.drafting') : t('ai.followUp.generateButton')}
          </Button>
        </div>
      </Card>

      {/* ── Output ── */}
      <Card className="flex flex-col">
        {!result && !loading && (
          <EmptyState emptyTitle={t('ai.followUp.emptyTitle')} emptySub={t('ai.followUp.emptySub')} />
        )}
        {loading && <LoadingState label={t('ai.followUp.draftingState')} />}

        {result && (
          <div className="flex flex-col gap-3 flex-1">
            {/* Tab bar */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              {TAB_META.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all',
                    activeTab === tab.id
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active message */}
            {TAB_META.map(tab => activeTab === tab.id && (
              <MessagePane
                key={tab.id}
                subtitle={tab.subtitle}
                content={result[tab.id]}
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
      <p dir="auto" className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap flex-1">{content}</p>
      <div className="mt-3 pt-3 border-t border-slate-100">
        <Button variant="outline" size="sm" onClick={onCopy}>
          {copied ? <Check className="w-3.5 h-3.5 text-success-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
    </div>
  )
}

function EmptyState({ emptyTitle, emptySub }: { emptyTitle: string; emptySub: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-64 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <MessageSquarePlus className="w-5 h-5 text-slate-300" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-slate-400">{emptyTitle}</p>
      <p className="text-xs text-slate-300 mt-1">{emptySub}</p>
    </div>
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-64 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 animate-pulse">
        <Sparkles className="w-5 h-5 text-slate-300" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-slate-400">{label}</p>
    </div>
  )
}
