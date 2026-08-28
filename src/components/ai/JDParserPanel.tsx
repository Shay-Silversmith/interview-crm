// ---------------------------------------------------------------------------
// JDParserPanel — live JD Parser with app-selector, staggered draft output,
// inline field editing, and explicit Master Save to the application record.
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { Sparkles, FileSearch, AlertCircle, Save, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useMockStore } from '@/hooks/useMockStore'
import { useToastActions } from '@/hooks/useToast'
import { useI18n } from '@/hooks/useI18n'
import { applicationsService } from '@/services/applicationsService'
import { aiService } from '@/services/aiService'
import { AppSelector } from './AppSelector'
import { SampleOutputNotice } from './SampleOutputNotice'
import type { FallbackReason } from '@/services/aiService'
import { SectionedDraft } from './SectionedDraft'
import type { FieldValue } from './EditableField'
import type { JDParserResponse } from '@/services/aiClientService'

export function JDParserPanel() {
  const toast = useToastActions()
  const { t } = useI18n()
  const { data: applications } = useMockStore(() => applicationsService.list())

  const LABELS: Record<keyof JDParserResponse, string> = {
    roleSummary:       t('ai.jdParser.labels.roleSummary'),
    responsibilities:  t('ai.jdParser.labels.responsibilities'),
    requirements:      t('ai.jdParser.labels.requirements'),
    niceToHaves:       t('ai.jdParser.labels.niceToHaves'),
    technologies:      t('ai.jdParser.labels.technologies'),
    whatTheyWant:      t('ai.jdParser.labels.whatTheyWant'),
    howIMatch:         t('ai.jdParser.labels.howIMatch'),
    whatToEmphasize:   t('ai.jdParser.labels.whatToEmphasize'),
    possibleQuestions: t('ai.jdParser.labels.possibleQuestions'),
    prepChecklist:     t('ai.jdParser.labels.prepChecklist'),
  }

  const [selectedAppId,    setSelectedAppId]    = useState('')
  const [roleTitle,        setRoleTitle]         = useState('')
  const [userBackground,   setUserBackground]    = useState('')
  const [jdText,           setJdText]            = useState('')
  const [loading,          setLoading]           = useState(false)
  const [saving,           setSaving]            = useState(false)
  const [draftData,        setDraftData]         = useState<Record<string, FieldValue> | null>(null)
  const [generateKey,      setGenerateKey]       = useState(0) // remounts SectionedDraft
  const [aiNotice,         setAiNotice]          = useState<FallbackReason | null | undefined>(null)

  const selectedApp = applications?.find(a => a.id === selectedAppId)

  // When a new application is selected, auto-fill its JD
  const handleAppSelect = (appId: string) => {
    setSelectedAppId(appId)
    const app = applications?.find(a => a.id === appId)
    if (app?.jobDescription) setJdText(app.jobDescription)
    if (app?.roleName) setRoleTitle(app.roleName)
  }

  const handleGenerate = async () => {
    if (!jdText.trim()) return
    setLoading(true)
    setDraftData(null)

    const result = await aiService.parseJD({
      jdText:         jdText.trim(),
      roleTitle:      roleTitle.trim() || undefined,
      userBackground: userBackground.trim() || undefined,
    })

    setLoading(false)

    // A canned pack is indistinguishable from a real one once it is on screen,
    // and this draft can be saved onto the application. Withhold it.
    if (result.fromFallback) {
      if (import.meta.env.DEV) console.warn('[JDParser] Fallback:', result)
      setAiNotice(result.fallbackReason)
      return
    }

    setAiNotice(null)
    setDraftData(result.data as unknown as Record<string, FieldValue>)
    setGenerateKey(k => k + 1)
  }

  const handleMasterSave = async () => {
    if (!draftData || !selectedAppId) return
    setSaving(true)
    try {
      await applicationsService.update(selectedAppId, { aiRoleSummary: draftData as Record<string, unknown> })
      toast.success(
        t('ai.toasts.savedAnalysis')
          .replace('{{role}}', selectedApp?.roleName ?? '')
          .replace('{{company}}', selectedApp?.companyName ?? '')
      )
    } catch {
      toast.error(t('ai.toasts.failedToSave'))
    }
    setSaving(false)
  }

  const canGenerate = jdText.trim().length > 20

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ── Input ── */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center border bg-violet-50 border-violet-200 text-violet-700">
            <FileSearch className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{t('ai.jdParser.title')}</h2>
            <p className="text-xs text-slate-500">{t('ai.jdParser.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <AppSelector
            applications={applications ?? []}
            value={selectedAppId}
            onChange={handleAppSelect}
            label={t('ai.jdParser.linkToApp')}
            placeholder={t('ai.jdParser.linkPlaceholder')}
          />
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.jdParser.roleTitleLabel')} <span className="text-slate-400">{t('ai.jdParser.optional')}</span>
            </label>
            <input
              value={roleTitle}
              onChange={e => setRoleTitle(e.target.value)}
              placeholder="e.g. Data Engineer"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.jdParser.backgroundLabel')} <span className="text-slate-400">{t('ai.jdParser.optional')}</span>
            </label>
            <textarea
              value={userBackground}
              onChange={e => setUserBackground(e.target.value)}
              placeholder="e.g. 3rd-year Industrial Engineering, 1-year analytics internship, Python/SQL"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 resize-none"
            />
          </div>
          <Textarea
            label={t('ai.jdParser.jdLabel')}
            placeholder={t('ai.jdParser.jdPlaceholder')}
            rows={10}
            value={jdText}
            onChange={e => setJdText(e.target.value)}
          />
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <Button className="w-full" onClick={handleGenerate} loading={loading} disabled={!canGenerate}>
            <Sparkles className="w-4 h-4" />
            {loading ? t('ai.jdParser.parsing') : t('ai.jdParser.parseButton')}
          </Button>
        </div>
      </Card>

      {/* ── Output ── */}
      <Card className="flex flex-col">
        {!draftData && !loading && (
          <EmptyState emptyTitle={t('ai.jdParser.emptyTitle')} emptySub={t('ai.jdParser.emptySub')} />
        )}

        {aiNotice !== null && <SampleOutputNotice reason={aiNotice} className="mb-3" />}
        {loading && (
          <LoadingState label={t('ai.jdParser.analysingState')} />
        )}

        {draftData && (
          <div className="flex flex-col gap-3">
            {/* Draft banner */}
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg border text-xs bg-violet-50 border-violet-200 text-violet-700">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="font-medium">{t('ai.draftBanner')}</span>
            </div>

            {/* Editable sections */}
            <div className="flex-1 overflow-auto">
              <SectionedDraft
                key={generateKey}
                data={draftData}
                labels={LABELS as Record<string, string>}
                onFieldSave={(key, val) => setDraftData(d => d ? { ...d, [key]: val } : d)}
              />
            </div>

            {/* Master Save */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {!selectedAppId && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {t('ai.jdParser.noAppSelected')}
                </p>
              )}
              {selectedAppId && (
                <p className="text-xs text-slate-500">
                  {t('ai.jdParser.savingTo')} <span className="font-medium text-slate-700">{selectedApp?.roleName} @ {selectedApp?.companyName}</span>
                </p>
              )}
              <Button
                className="w-full"
                onClick={handleMasterSave}
                loading={saving}
                disabled={!selectedAppId}
              >
                <Save className="w-4 h-4" />
                {saving ? t('ai.jdParser.saving') : t('ai.jdParser.saveButton')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function EmptyState({ emptyTitle, emptySub }: { emptyTitle: string; emptySub: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-64 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <FileSearch className="w-5 h-5 text-slate-300" strokeWidth={1.5} />
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
