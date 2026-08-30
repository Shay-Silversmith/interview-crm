// ---------------------------------------------------------------------------
// JDParserPanel — analyse a job posting against this candidate's CV.
//
// The posting can arrive as a link or as pasted text. The link is what people
// actually have — they are looking at the LinkedIn tab — and requiring a copy
// and paste was the main reason this tool went unused.
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { Sparkles, FileSearch, AlertCircle, Save, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useMockStore } from '@/hooks/useMockStore'
import { useCandidate } from '@/hooks/useCandidate'
import { useToastActions } from '@/hooks/useToast'
import { useI18n } from '@/hooks/useI18n'
import { applicationsService } from '@/services/applicationsService'
import { aiService, type AIRun } from '@/services/aiService'
import { AppSelector } from './AppSelector'
import { AIFailureNotice } from './AIFailureNotice'
import {
  Section, Prose, BulletList, ChipRow, CopyButton, SourceList,
  PanelEmpty, PanelLoading, ToolIntro,
} from './ResultBlocks'
import { cn } from '@/lib/cn'
import type { FitItem, FitLevel, JDParserResponse, GroundingSource } from '@/services/aiClientService'

type RunState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done';  data: JDParserResponse; sources?: GroundingSource[] }
  | { status: 'error'; run: Extract<AIRun<never>, { ok: false }> }

const FIT_STYLE: Record<FitLevel, { chip: string; dot: string }> = {
  strong:  { chip: 'bg-success-50 border-success-200 text-success-700', dot: 'bg-success-500' },
  partial: { chip: 'bg-warning-50 border-warning-200 text-warning-800', dot: 'bg-warning-500' },
  gap:     { chip: 'bg-danger-50 border-danger-200 text-danger-700',    dot: 'bg-danger-500' },
}

function toPlainText(d: JDParserResponse): string {
  const block = (h: string, items?: string[]) =>
    items && items.length ? `## ${h}\n${items.map(i => `• ${i}`).join('\n')}\n` : ''
  return [
    `# ${d.roleSummary}`,
    `Level: ${d.seniority}\n`,
    block('Responsibilities', d.responsibilities),
    block('Requirements', d.requirements),
    block('Nice to have', d.niceToHaves),
    block('Technologies', d.technologies),
    `## What they want\n${d.whatTheyWant}\n`,
    d.fitAnalysis?.length
      ? `## Fit\n${d.fitAnalysis.map(f => `• [${f.level}] ${f.requirement} — ${f.evidence}`).join('\n')}\n`
      : '',
    block('How I match', d.howIMatch),
    block('Gaps to address', d.gapsToAddress),
    block('What to emphasize', d.whatToEmphasize),
    block('Possible questions', d.possibleQuestions),
    block('Prep checklist', d.prepChecklist),
  ].filter(Boolean).join('\n')
}

export function JDParserPanel() {
  const toast = useToastActions()
  const { t, locale } = useI18n()
  const { data: applications } = useMockStore(() => applicationsService.list())

  const [selectedAppId, setSelectedAppId] = useState('')
  const [roleTitle,     setRoleTitle]     = useState('')
  const [companyName,   setCompanyName]   = useState('')
  const [jdUrl,         setJdUrl]         = useState('')
  const [jdText,        setJdText]        = useState('')
  const [saving,        setSaving]        = useState(false)
  const [state,         setState]         = useState<RunState>({ status: 'idle' })

  const selectedApp = applications?.find(a => a.id === selectedAppId)
  const { candidate, activeCV } = useCandidate(selectedApp?.submittedCvId)

  const handleAppSelect = (appId: string) => {
    setSelectedAppId(appId)
    const app = applications?.find(a => a.id === appId)
    if (!app) return
    if (app.jobDescription) setJdText(app.jobDescription)
    if (app.roleName)       setRoleTitle(app.roleName)
    if (app.companyName)    setCompanyName(app.companyName)
    if (app.roleUrl)        setJdUrl(app.roleUrl)
  }

  const urlLooksValid = /^https?:\/\/.+\..+/.test(jdUrl.trim())
  const canGenerate   = jdText.trim().length > 20 || urlLooksValid

  const handleGenerate = async () => {
    if (!canGenerate) return
    setState({ status: 'loading' })

    const res = await aiService.parseJD({
      jdText:      jdText.trim() || undefined,
      jdUrl:       urlLooksValid ? jdUrl.trim() : undefined,
      roleTitle:   roleTitle.trim() || undefined,
      companyName: companyName.trim() || undefined,
      candidate,
      locale:      locale as 'en' | 'he',
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
      await applicationsService.update(selectedAppId, {
        aiRoleSummary: state.data as unknown as Record<string, unknown>,
      })
      toast.success(
        t('ai.toasts.savedAnalysis')
          .replace('{{role}}', selectedApp?.roleName ?? '')
          .replace('{{company}}', selectedApp?.companyName ?? ''),
      )
    } catch {
      toast.error(t('ai.toasts.failedToSave'))
    }
    setSaving(false)
  }

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
          <ToolIntro
            what={t('ai.jdParser.introWhat')}
            how={[
              t('ai.jdParser.introStep1'),
              t('ai.jdParser.introStep2'),
              t('ai.jdParser.introStep3'),
            ]}
            needs={activeCV
              ? `${t('ai.jdParser.usingCV')} ${activeCV.name}`
              : t('ai.jdParser.noCV')}
          />

          <AppSelector
            applications={applications ?? []}
            value={selectedAppId}
            onChange={handleAppSelect}
            label={t('ai.jdParser.linkToApp')}
            placeholder={t('ai.jdParser.linkPlaceholder')}
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t('ai.jdParser.roleTitleLabel')}
              </label>
              <input
                value={roleTitle}
                onChange={e => setRoleTitle(e.target.value)}
                placeholder="Data Engineer"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t('ai.jdParser.companyLabel')}
              </label>
              <input
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Wix"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.jdParser.urlLabel')}
            </label>
            <div className="relative">
              <Link2 className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                value={jdUrl}
                onChange={e => setJdUrl(e.target.value)}
                dir="ltr"
                placeholder="https://www.linkedin.com/jobs/view/…"
                className="w-full h-9 ps-9 pe-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
            <p className="text-2xs text-slate-400 mt-1">{t('ai.jdParser.urlHint')}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-2xs text-slate-400">{t('ai.jdParser.or')}</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.jdParser.jdLabel')}
            </label>
            <textarea
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              dir="auto"
              rows={9}
              placeholder={t('ai.jdParser.jdPlaceholder')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 leading-relaxed"
            />
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
            {state.status === 'loading' ? t('ai.jdParser.parsing') : t('ai.jdParser.parseButton')}
          </Button>
        </div>
      </Card>

      {/* ── Output ── */}
      <Card className="flex flex-col">
        {state.status === 'idle' && (
          <PanelEmpty
            icon={FileSearch}
            title={t('ai.jdParser.emptyTitle')}
            sub={t('ai.jdParser.emptySub')}
          />
        )}

        {state.status === 'loading' && (
          <PanelLoading
            label={t('ai.jdParser.analysingState')}
            sub={urlLooksValid && !jdText.trim() ? t('ai.jdParser.readingUrl') : undefined}
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
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p dir="auto" className="text-sm font-semibold text-slate-800 leading-snug">
                  {state.data.roleSummary}
                </p>
                {state.data.seniority && (
                  <span className="inline-block mt-1.5 text-2xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {state.data.seniority}
                  </span>
                )}
              </div>
              <CopyButton text={toPlainText(state.data)} label={t('ai.copyAll')} className="shrink-0" />
            </div>

            {state.data.sourceNote && (
              <div className="rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-900">
                {state.data.sourceNote}
              </div>
            )}

            <div className="flex-1 overflow-auto space-y-4 pe-1">
              {state.data.fitAnalysis?.length > 0 && (
                <Section title={t('ai.jdParser.labels.fitAnalysis')} hint={t('ai.jdParser.labels.fitHint')}>
                  <div className="space-y-1.5">
                    {state.data.fitAnalysis.map((f, i) => <FitRow key={i} item={f} t={t} />)}
                  </div>
                </Section>
              )}

              <Section title={t('ai.jdParser.labels.whatTheyWant')}>
                <Prose>{state.data.whatTheyWant}</Prose>
              </Section>

              <BulletList title={t('ai.jdParser.labels.gaps')}             items={state.data.gapsToAddress} />
              <BulletList title={t('ai.jdParser.labels.whatToEmphasize')}  items={state.data.whatToEmphasize} />
              <BulletList title={t('ai.jdParser.labels.howIMatch')}        items={state.data.howIMatch} />
              <BulletList title={t('ai.jdParser.labels.possibleQuestions')} items={state.data.possibleQuestions} />
              <BulletList title={t('ai.jdParser.labels.prepChecklist')}    items={state.data.prepChecklist} />
              <BulletList title={t('ai.jdParser.labels.responsibilities')} items={state.data.responsibilities} />
              <BulletList title={t('ai.jdParser.labels.requirements')}     items={state.data.requirements} />
              <BulletList title={t('ai.jdParser.labels.niceToHaves')}      items={state.data.niceToHaves} />
              <ChipRow    title={t('ai.jdParser.labels.technologies')}     items={state.data.technologies} />

              <SourceList sources={state.sources} />
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              {!selectedAppId ? (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {t('ai.jdParser.noAppSelected')}
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  {t('ai.jdParser.savingTo')}{' '}
                  <span className="font-medium text-slate-700">
                    {selectedApp?.roleName} @ {selectedApp?.companyName}
                  </span>
                </p>
              )}
              <Button
                className="w-full"
                variant="outline"
                onClick={handleSave}
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

function FitRow({ item, t }: { item: FitItem; t: (key: string) => string }) {
  const style = FIT_STYLE[item.level] ?? FIT_STYLE.partial

  return (
    <div className={cn('rounded-lg border px-3 py-2', style.chip)}>
      <div className="flex items-start gap-2">
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 mt-1.5', style.dot)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p dir="auto" className="text-xs font-semibold leading-snug">{item.requirement}</p>
            <span className="text-2xs font-bold uppercase shrink-0 opacity-70">
              {t(`ai.jdParser.fit.${item.level}`)}
            </span>
          </div>
          <p dir="auto" className="text-xs mt-1 leading-relaxed opacity-90">{item.evidence}</p>
        </div>
      </div>
    </div>
  )
}
