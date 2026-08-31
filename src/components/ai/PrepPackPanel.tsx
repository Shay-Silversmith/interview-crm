// ---------------------------------------------------------------------------
// PrepPackPanel — pick an application and an interview type; the panel composes
// everything the app already knows (JD, saved role analysis, CV, past rounds,
// profile) and produces one prep document.
//
// The context preview is not decoration. This tool's output is only as good as
// what it was given, and when it silently ran with no CV and no JD the result
// looked identical to a well-informed one. The preview shows what is actually
// going in, so a thin pack has a visible cause.
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { Sparkles, Brain, Save, Check, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useMockStore } from '@/hooks/useMockStore'
import { useProfile } from '@/hooks/useProfile'
import { useCandidate } from '@/hooks/useCandidate'
import { useToastActions } from '@/hooks/useToast'
import { useI18n } from '@/hooks/useI18n'
import { applicationsService } from '@/services/applicationsService'
import { companiesService } from '@/services/companiesService'
import { aiService, type AIRun, type PrepPack } from '@/services/aiService'
import { AppSelector } from './AppSelector'
import { AIFailureNotice } from './AIFailureNotice'
import {
  Section, Prose, BulletList, CopyButton, SourceList,
  PanelEmpty, PanelLoading, ToolIntro,
} from './ResultBlocks'
import { cn } from '@/lib/cn'
import type { GroundingSource } from '@/services/aiClientService'

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

type RunState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done';  data: PrepPack; sources?: GroundingSource[] }
  | { status: 'error'; run: Extract<AIRun<never>, { ok: false }> }

function toPlainText(pack: PrepPack, title: string): string {
  const { research: r, plan: p } = pack
  const block = (h: string, items?: string[]) =>
    items && items.length ? `## ${h}\n${items.map(i => `• ${i}`).join('\n')}\n` : ''

  return [
    `# ${title}`,
    r?.companySnapshot ? `## Company\n${r.companySnapshot}\n` : '',
    p?.roleSummary     ? `## The role\n${p.roleSummary}\n` : '',
    block('Lead with this from your CV', p?.reviewFromCV),
    block('Expected HR questions', r?.expectedHRQuestions),
    block('Expected technical questions', p?.expectedTechnicalQuestions),
    p?.recommendedStarStories?.length
      ? `## STAR stories\n${p.recommendedStarStories.map(s =>
          `### ${s.title || 'Story'}\nS: ${s.situation}\nT: ${s.task}\nA: ${s.action}\nR: ${s.result}`,
        ).join('\n\n')}\n`
      : '',
    block('Questions to ask', r?.questionsToAsk),
    block('Things to probe', r?.redFlagsToProbe),
    block('Checklist', p?.finalChecklist),
    block('Day of', p?.dayOfPlan),
  ].filter(Boolean).join('\n')
}

export function PrepPackPanel() {
  const toast = useToastActions()
  const { t, locale } = useI18n()
  const { profile } = useProfile()
  const { data: applications } = useMockStore(() => applicationsService.list())
  const { data: companies }    = useMockStore(() => companiesService.list())

  const [selectedAppId, setSelectedAppId] = useState('')
  const [interviewType, setInterviewType] = useState('')
  const [research,      setResearch]      = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [state,         setState]         = useState<RunState>({ status: 'idle' })

  const selectedApp = applications?.find(a => a.id === selectedAppId)
  const company     = companies?.find(c => c.id === selectedApp?.companyId)

  // Prefer the CV actually submitted with this application over the active one.
  const { candidate, activeCV, cvVersions } = useCandidate(selectedApp?.submittedCvId)
  const submittedCV = cvVersions.find(cv => cv.id === selectedApp?.submittedCvId) ?? activeCV

  const canGenerate = !!selectedAppId && !!interviewType

  const handleGenerate = async () => {
    if (!selectedApp) return
    setState({ status: 'loading' })

    const completedStages = selectedApp.interviewStages.filter(s => s.completedAt)

    const res = await aiService.generatePrepPack({
      application: {
        title:   selectedApp.roleName,
        company: selectedApp.companyName,
        stage:   selectedApp.stage,
        jdText:  selectedApp.jobDescription,
        jdUrl:   selectedApp.roleUrl,
        // The saved JD-parser output is the richest role context the app holds;
        // leaving it out was why the pack repeated work already done.
        aiRoleSummary: selectedApp.aiRoleSummary
          ? JSON.stringify(selectedApp.aiRoleSummary).slice(0, 5800)
          : undefined,
        notes: selectedApp.notes,
      },
      cv: submittedCV
        ? {
            emphasis:            submittedCV.emphasis,
            skillsHighlighted:   submittedCV.skillsHighlighted,
            projectsHighlighted: submittedCV.projectsHighlighted,
          }
        : null,
      company: {
        name:               selectedApp.companyName,
        summary:            company?.description,
        productDescription: company?.notes,
      },
      pastInterviews: completedStages.map(s => ({
        type:         s.type,
        questions:    [],
        roughAnswers: [],
        takeaways:    [s.notes, s.feedbackReceived].filter(Boolean).join(' — '),
      })),
      userBackground:
        candidate?.background ||
        profile?.defaultPitch ||
        profile?.bio ||
        `${profile?.displayName || profile?.name || 'I'} — currently exploring opportunities`,
      interviewType,
      research,
      locale: locale as 'en' | 'he',
    })

    if (!res.ok) {
      setState({ status: 'error', run: res })
      return
    }
    setState({ status: 'done', data: res.data, sources: res.sources })
  }

  const handleSave = async () => {
    if (state.status !== 'done' || !selectedAppId) return
    setSaving(true)
    try {
      // Flatten the two halves back into one record — the split is a transport
      // detail, and a saved pack should not carry it.
      await aiService.savePrepPack(selectedAppId, {
        ...(state.data.research ?? {}),
        ...(state.data.plan ?? {}),
      })
      toast.success(
        t('ai.toasts.savedPrepPack')
          .replace('{{role}}', selectedApp?.roleName ?? '')
          .replace('{{company}}', selectedApp?.companyName ?? ''),
      )
    } catch (err) {
      toast.error(`${t('ai.toasts.failedToSavePack')} — ${err instanceof Error ? err.message : 'unknown error'}`)
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
          <ToolIntro
            what={t('ai.prepPack.introWhat')}
            how={[
              t('ai.prepPack.introStep1'),
              t('ai.prepPack.introStep2'),
              t('ai.prepPack.introStep3'),
            ]}
          />

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
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">{t('ai.prepPack.interviewTypePlaceholder')}</option>
              {INTERVIEW_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={research}
              onChange={e => setResearch(e.target.checked)}
              className="mt-0.5 accent-primary-600"
            />
            <span>
              <span className="block text-xs font-medium text-slate-700">
                {t('ai.prepPack.researchLabel')}
              </span>
              <span className="block text-2xs text-slate-500 mt-0.5">
                {t('ai.prepPack.researchHint')}
              </span>
            </span>
          </label>

          {selectedApp && (
            <ContextPreview
              t={t}
              rows={[
                { label: t('ai.prepPack.contextApp'), value: `${selectedApp.roleName} @ ${selectedApp.companyName}`, ok: true },
                { label: t('ai.prepPack.contextJD'),  value: selectedApp.jobDescription ? t('ai.prepPack.included') : t('ai.prepPack.missing'), ok: !!selectedApp.jobDescription },
                { label: t('ai.prepPack.contextCV'),  value: submittedCV?.name ?? t('ai.prepPack.contextCVNone'), ok: !!submittedCV },
                { label: t('ai.prepPack.contextAnalysis'), value: selectedApp.aiRoleSummary ? t('ai.prepPack.included') : t('ai.prepPack.missing'), ok: !!selectedApp.aiRoleSummary },
                { label: t('ai.prepPack.contextStages'), value: String(selectedApp.interviewStages.filter(s => s.completedAt).length), ok: selectedApp.interviewStages.some(s => s.completedAt) },
              ]}
            />
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <Button
            className="w-full"
            onClick={handleGenerate}
            loading={state.status === 'loading'}
            disabled={!canGenerate}
          >
            <Sparkles className="w-4 h-4" />
            {state.status === 'loading' ? t('ai.prepPack.preparing') : t('ai.prepPack.buildButton')}
          </Button>
        </div>
      </Card>

      {/* ── Output ── */}
      <Card className="flex flex-col">
        {state.status === 'idle' && (
          <PanelEmpty
            icon={Brain}
            title={t('ai.prepPack.emptyTitle')}
            sub={t('ai.prepPack.emptySub')}
          />
        )}

        {state.status === 'loading' && (
          <PanelLoading
            label={t('ai.prepPack.buildingState')}
            sub={research ? t('ai.prepPack.buildingResearch') : undefined}
          />
        )}

        {state.status === 'error' && (
          <AIFailureNotice
            reason={state.run.reason}
            message={state.run.message}
            onRetry={handleGenerate}
          />
        )}

        {state.status === 'done' && (
          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">
                {selectedApp?.roleName} @ {selectedApp?.companyName}
              </p>
              <CopyButton
                text={toPlainText(state.data, `${selectedApp?.roleName} @ ${selectedApp?.companyName}`)}
                label={t('ai.copyAll')}
                className="shrink-0"
              />
            </div>

            {state.data.partial && (
              <div className="flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-900">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                <div className="space-y-1">
                  <p>
                    {state.data.partial.half === 'research'
                      ? t('ai.prepPack.partialResearch')
                      : t('ai.prepPack.partialPlan')}
                  </p>
                  <button onClick={handleGenerate} className="font-medium underline hover:no-underline">
                    {t('ai.prepPack.retryMissing')}
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-auto space-y-4 pe-1">
              {state.data.research?.companySnapshot && (
                <Section title={t('ai.prepPack.labels.companySnapshot')}>
                  <Prose>{state.data.research.companySnapshot}</Prose>
                </Section>
              )}
              {state.data.plan?.roleSummary && (
                <Section title={t('ai.prepPack.labels.roleSummary')}>
                  <Prose>{state.data.plan.roleSummary}</Prose>
                </Section>
              )}

              <BulletList title={t('ai.prepPack.labels.reviewFromCV')} items={state.data.plan?.reviewFromCV} />
              <BulletList title={t('ai.prepPack.labels.expectedHRQuestions')} items={state.data.research?.expectedHRQuestions} />
              <BulletList title={t('ai.prepPack.labels.expectedTechnicalQuestions')} items={state.data.plan?.expectedTechnicalQuestions} />

              {(state.data.plan?.recommendedStarStories?.length ?? 0) > 0 && (
                <Section title={t('ai.prepPack.labels.recommendedStarStories')}>
                  <div className="space-y-2">
                    {state.data.plan!.recommendedStarStories.map((s, i) => (
                      <div key={i} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
                        {s.title && (
                          <p dir="auto" className="text-xs font-semibold text-slate-800 mb-1.5">{s.title}</p>
                        )}
                        {([
                          ['S', s.situation], ['T', s.task], ['A', s.action], ['R', s.result],
                        ] as const).map(([letter, text]) => (
                          <p key={letter} dir="auto" className="text-xs text-slate-600 leading-relaxed mb-1">
                            <span className="font-bold text-primary-600">{letter}:</span> {text}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              <BulletList title={t('ai.prepPack.labels.questionsToAsk')} items={state.data.research?.questionsToAsk} />
              <BulletList title={t('ai.prepPack.labels.redFlags')} items={state.data.research?.redFlagsToProbe} />
              <BulletList title={t('ai.prepPack.labels.finalChecklist')} items={state.data.plan?.finalChecklist} />
              <BulletList title={t('ai.prepPack.labels.dayOfPlan')} items={state.data.plan?.dayOfPlan} ordered />

              <SourceList sources={state.sources} />
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Button className="w-full" variant="outline" onClick={handleSave} loading={saving}>
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
  rows, t,
}: {
  rows: { label: string; value: string; ok: boolean }[]
  t: (key: string) => string
}) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
      <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest mb-2">
        {t('ai.prepPack.contextTitle')}
      </p>
      <ul className="space-y-1">
        {rows.map(row => (
          <li key={row.label} className="flex items-center gap-2 text-xs">
            {row.ok
              ? <Check className="w-3 h-3 text-success-600 shrink-0" />
              : <X className="w-3 h-3 text-slate-300 shrink-0" />}
            <span className="text-slate-500">{row.label}:</span>
            <span className={cn('truncate', row.ok ? 'text-slate-700 font-medium' : 'text-slate-400')}>
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
