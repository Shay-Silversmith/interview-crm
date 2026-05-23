// ---------------------------------------------------------------------------
// PrepPackPanel — select an application + interview type; auto-compose the
// full context; generate a prep pack; edit sections; save to ai_summaries.
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { Sparkles, Brain, AlertCircle, Save, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useMockStore } from '@/hooks/useMockStore'
import { useProfile } from '@/hooks/useProfile'
import { useToastActions } from '@/hooks/useToast'
import { useI18n } from '@/hooks/useI18n'
import { applicationsService } from '@/services/applicationsService'
import { documentsService } from '@/services/documentsService'
import { aiService } from '@/services/aiService'
import { AppSelector } from './AppSelector'
import { SectionedDraft } from './SectionedDraft'
import type { FieldValue } from './EditableField'
import type { PrepPackResponse } from '@/services/aiClientService'
import { cn } from '@/lib/cn'

const INTERVIEW_TYPES = [
  'HR Screen',
  'Technical Interview',
  'Home Assignment Review',
  'System Design',
  'Manager Interview',
  'Final Interview',
  'Behavioral',
  'Case Study',
]

export function PrepPackPanel() {
  const toast = useToastActions()
  const { t, locale } = useI18n()
  const { profile } = useProfile()
  const { data: applications }  = useMockStore(() => applicationsService.list())
  const { data: cvVersions }    = useMockStore(() => documentsService.listCVVersions())

  const LABELS: Record<keyof PrepPackResponse, string> = {
    companySnapshot:             t('ai.prepPack.labels.companySnapshot'),
    roleSummary:                 t('ai.prepPack.labels.roleSummary'),
    reviewFromCV:                t('ai.prepPack.labels.reviewFromCV'),
    expectedHRQuestions:         t('ai.prepPack.labels.expectedHRQuestions'),
    expectedTechnicalQuestions:  t('ai.prepPack.labels.expectedTechnicalQuestions'),
    recommendedStarStories:      t('ai.prepPack.labels.recommendedStarStories'),
    questionsToAsk:              t('ai.prepPack.labels.questionsToAsk'),
    finalChecklist:              t('ai.prepPack.labels.finalChecklist'),
  }

  const [selectedAppId,  setSelectedAppId]  = useState('')
  const [interviewType,  setInterviewType]  = useState('')
  const [loading,        setLoading]        = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [draftData,      setDraftData]      = useState<Record<string, FieldValue> | null>(null)
  const [generateKey,    setGenerateKey]    = useState(0)
  const [fromFallback,   setFromFallback]   = useState(false)

  const selectedApp = applications?.find(a => a.id === selectedAppId)
  const submittedCV = cvVersions?.find(cv => cv.id === selectedApp?.submittedCvId)

  const canGenerate = !!selectedAppId && !!interviewType

  const handleGenerate = async () => {
    if (!selectedApp) return
    setLoading(true)
    setDraftData(null)

    // Auto-compose the request from app data
    const completedStages = selectedApp.interviewStages.filter(s => s.completedAt)
    const result = await aiService.generatePrepPack({
      application: {
        title:         selectedApp.roleName,
        company:       selectedApp.companyName,
        stage:         selectedApp.stage,
        jdText:        selectedApp.jobDescription,
        aiRoleSummary: undefined,
        notes:         selectedApp.notes,
      },
      cv: submittedCV
        ? {
            emphasis:            submittedCV.emphasis,
            skillsHighlighted:   submittedCV.skillsHighlighted,
            projectsHighlighted: submittedCV.projectsHighlighted,
          }
        : null,
      company: { name: selectedApp.companyName },
      pastInterviews: completedStages.map(s => ({
        type:         s.type,
        questions:    [],
        roughAnswers: [],
        takeaways:    s.notes ?? '',
      })),
      // Live profile pitch takes priority; generic fallback if user hasn't set one yet.
      userBackground:
        profile?.defaultPitch ||
        profile?.bio ||
        `${profile?.displayName || profile?.name || 'I'} — currently exploring opportunities`,
      interviewType,
    }, locale as 'en' | 'he' | undefined)

    setLoading(false)

    if (result.fromFallback) {
      switch (result.fallbackReason) {
        case 'disabled':
          toast.info(t('ai.toasts.disabled'))
          break
        case 'rate-limited':
          toast.error(t('ai.toasts.rateLimited'))
          break
        case 'validation-error':
          toast.info(t('ai.toasts.validationFallback'))
          if (import.meta.env.DEV) console.warn('[PrepPack] Validation fallback:', result)
          break
        default:
          toast.info(t('ai.toasts.unreachable'))
      }
    }

    setFromFallback(result.fromFallback)
    setDraftData(result.data as unknown as Record<string, FieldValue>)
    setGenerateKey(k => k + 1)
  }

  const handleMasterSave = async () => {
    if (!draftData || !selectedAppId || !selectedApp) return
    setSaving(true)
    try {
      // Reconstruct PrepPackResponse from the (possibly edited) draft
      const finalData = draftData as unknown as PrepPackResponse
      await aiService.savePrepPack(selectedAppId, finalData)
      toast.success(
        t('ai.toasts.savedPrepPack')
          .replace('{{role}}', selectedApp.roleName)
          .replace('{{company}}', selectedApp.companyName)
      )
    } catch {
      toast.error(t('ai.toasts.failedToSavePack'))
    }
    setSaving(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ── Input ── */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center border bg-warning-50 border-warning-200 text-warning-700">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{t('ai.prepPack.title')}</h2>
            <p className="text-xs text-slate-500">{t('ai.prepPack.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <AppSelector
            applications={applications ?? []}
            value={selectedAppId}
            onChange={setSelectedAppId}
            label={t('ai.prepPack.appLabel')}
            required
            placeholder={t('ai.prepPack.appPlaceholder')}
          />

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.prepPack.interviewTypeLabel')} <span className="text-danger-500">*</span>
            </label>
            <select
              value={interviewType}
              onChange={e => setInterviewType(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
            >
              <option value="">{t('ai.prepPack.interviewTypePlaceholder')}</option>
              {INTERVIEW_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          {/* Auto-composed context preview */}
          {selectedApp && (
            <ContextPreview
              appName={`${selectedApp.roleName} @ ${selectedApp.companyName}`}
              cvName={submittedCV?.name}
              stagesCount={selectedApp.interviewStages.filter(s => s.completedAt).length}
              t={t}
            />
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <Button className="w-full" onClick={handleGenerate} loading={loading} disabled={!canGenerate}>
            <Sparkles className="w-4 h-4" />
            {loading ? t('ai.prepPack.preparing') : t('ai.prepPack.buildButton')}
          </Button>
        </div>
      </Card>

      {/* ── Output ── */}
      <Card className="flex flex-col">
        {!draftData && !loading && (
          <EmptyState emptyTitle={t('ai.prepPack.emptyTitle')} emptySub={t('ai.prepPack.emptySub')} />
        )}
        {loading && <LoadingState label={t('ai.prepPack.buildingState')} />}

        {draftData && (
          <div className="flex flex-col gap-3">
            <div className={cn(
              'flex items-start gap-2 px-3 py-2 rounded-lg border text-xs',
              fromFallback
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-warning-50 border-warning-200 text-warning-700'
            )}>
              {fromFallback
                ? <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                : <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
              <span className="font-medium">
                {fromFallback ? t('ai.mockBanner') : t('ai.draftBanner')}
              </span>
            </div>

            <div className="flex-1 overflow-auto">
              <SectionedDraft
                key={generateKey}
                data={draftData}
                labels={LABELS as Record<string, string>}
                onFieldSave={(key, val) => setDraftData(d => d ? { ...d, [key]: val } : d)}
              />
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Button
                className="w-full"
                onClick={handleMasterSave}
                loading={saving}
                disabled={!selectedAppId}
              >
                <Save className="w-4 h-4" />
                {saving ? t('ai.prepPack.saving') : t('ai.prepPack.saveButton')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function ContextPreview({
  appName, cvName, stagesCount, t,
}: { appName: string; cvName?: string; stagesCount: number; t: (key: string) => string }) {
  const stagesLabel = stagesCount === 0
    ? t('ai.prepPack.contextNone')
    : stagesCount === 1
      ? t('ai.prepPack.contextStagesSingular').replace('{{count}}', String(stagesCount))
      : t('ai.prepPack.contextStagesPlural').replace('{{count}}', String(stagesCount))

  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 space-y-1">
      <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('ai.prepPack.contextTitle')}</p>
      <p className="text-xs text-slate-600">
        <span className="font-medium text-slate-700">{t('ai.prepPack.contextApp')}:</span> {appName}
      </p>
      <p className="text-xs text-slate-600">
        <span className="font-medium text-slate-700">{t('ai.prepPack.contextCV')}:</span> {cvName ?? t('ai.prepPack.contextCVNone')}
      </p>
      <p className="text-xs text-slate-600">
        <span className="font-medium text-slate-700">{t('ai.prepPack.contextStages')}:</span> {stagesLabel}
      </p>
      <p className="text-xs text-slate-600">
        <span className="font-medium text-slate-700">{t('ai.prepPack.contextBackground')}:</span> {t('ai.prepPack.contextBgValue')}
      </p>
    </div>
  )
}

function EmptyState({ emptyTitle, emptySub }: { emptyTitle: string; emptySub: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-64 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <Brain className="w-5 h-5 text-slate-300" strokeWidth={1.5} />
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
