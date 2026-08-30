// ---------------------------------------------------------------------------
// InterviewDebriefPanel — messy post-interview notes in, an organised record out.
//
// The input is deliberately one big unstructured box. Anyone typing this has
// just walked out of an interview and is trying to get everything down before
// they forget it; asking them to fill in eight fields first guarantees the tool
// goes unused at exactly the moment it is worth most.
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { Sparkles, NotebookPen, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useMockStore } from '@/hooks/useMockStore'
import { useCandidate } from '@/hooks/useCandidate'
import { useToastActions } from '@/hooks/useToast'
import { useI18n } from '@/hooks/useI18n'
import { applicationsService } from '@/services/applicationsService'
import { aiService, type AIRun } from '@/services/aiService'
import { AIFailureNotice } from './AIFailureNotice'
import {
  Section, Prose, BulletList, CopyButton, PanelEmpty, PanelLoading, ToolIntro,
} from './ResultBlocks'
import type { InterviewDebriefResponse } from '@/services/aiClientService'

const INTERVIEW_TYPES = [
  'HR Screen', 'Hiring Manager', 'Technical', 'Home Assignment Review',
  'System Design', 'Case Study', 'Panel', 'Final / Founder',
]

type RunState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done';  data: InterviewDebriefResponse }
  | { status: 'error'; run: Extract<AIRun<never>, { ok: false }> }

export function InterviewDebriefPanel() {
  const toast = useToastActions()
  const { t, locale } = useI18n()
  const { candidate } = useCandidate()
  const { data: applications } = useMockStore(() => applicationsService.list())

  const [selectedAppId,  setSelectedAppId]  = useState('')
  const [interviewType,  setInterviewType]  = useState(INTERVIEW_TYPES[0])
  const [interviewer,    setInterviewer]    = useState('')
  const [interviewedAt,  setInterviewedAt]  = useState(() => new Date().toISOString().slice(0, 10))
  const [notes,          setNotes]          = useState('')
  const [saving,         setSaving]         = useState(false)
  const [state,          setState]          = useState<RunState>({ status: 'idle' })

  const selectedApp = applications?.find(a => a.id === selectedAppId)
  const canRun = notes.trim().length >= 20

  const handleGenerate = async () => {
    if (!canRun) return
    setState({ status: 'loading' })

    const res = await aiService.interviewDebrief({
      notes:         notes.trim(),
      company:       selectedApp?.companyName,
      role:          selectedApp?.roleName,
      interviewType,
      interviewer:   interviewer.trim() || undefined,
      interviewedAt,
      candidate,
      locale:        locale as 'en' | 'he',
    })

    if (!res.ok) {
      setState({ status: 'error', run: res })
      return
    }
    setState({ status: 'done', data: res.data })
  }

  const handleSave = async () => {
    if (state.status !== 'done') return
    setSaving(true)
    try {
      await aiService.saveSummary('Interview Summary', state.data, {
        applicationId: selectedAppId || undefined,
        companyId:     selectedApp?.companyId,
        inputData:     { notes: notes.trim().slice(0, 4000), interviewType, interviewedAt },
      })
      toast.success(t('ai.debrief.saved'))
    } catch {
      toast.error(t('ai.debrief.saveFailed'))
    }
    setSaving(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ── Input ── */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center border bg-success-50 border-success-200 text-success-700">
            <NotebookPen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{t('ai.debrief.title')}</h2>
            <p className="text-xs text-slate-500">{t('ai.debrief.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <ToolIntro
            what={t('ai.debrief.introWhat')}
            how={[
              t('ai.debrief.introStep1'),
              t('ai.debrief.introStep2'),
              t('ai.debrief.introStep3'),
            ]}
            needs={t('ai.debrief.introNeeds')}
          />

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.debrief.appLabel')} <span className="text-slate-400">({t('ai.jdParser.optional')})</span>
            </label>
            <select
              value={selectedAppId}
              onChange={e => setSelectedAppId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">{t('ai.debrief.appPlaceholder')}</option>
              {(applications ?? []).map(app => (
                <option key={app.id} value={app.id}>{app.roleName} @ {app.companyName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t('ai.debrief.typeLabel')}
              </label>
              <select
                value={interviewType}
                onChange={e => setInterviewType(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              >
                {INTERVIEW_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t('ai.debrief.dateLabel')}
              </label>
              <input
                type="date"
                value={interviewedAt}
                onChange={e => setInterviewedAt(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.debrief.interviewerLabel')} <span className="text-slate-400">({t('ai.jdParser.optional')})</span>
            </label>
            <input
              value={interviewer}
              onChange={e => setInterviewer(e.target.value)}
              placeholder="Dana, Engineering Manager"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label className="block text-xs font-medium text-slate-600">
                {t('ai.debrief.notesLabel')}<span className="text-danger-500 ms-0.5">*</span>
              </label>
              <span className="text-2xs text-slate-400">{notes.trim().length} {t('ai.debrief.chars')}</span>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              dir="auto"
              rows={12}
              placeholder={t('ai.debrief.notesPlaceholder')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 leading-relaxed"
            />
            <p className="text-2xs text-slate-400 mt-1">{t('ai.debrief.notesHint')}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <Button
            className="w-full"
            onClick={handleGenerate}
            loading={state.status === 'loading'}
            disabled={!canRun}
          >
            <Sparkles className="w-4 h-4" />
            {state.status === 'loading' ? t('ai.debrief.organising') : t('ai.debrief.button')}
          </Button>
        </div>
      </Card>

      {/* ── Output ── */}
      <Card className="flex flex-col">
        {state.status === 'idle' && (
          <PanelEmpty
            icon={NotebookPen}
            title={t('ai.debrief.emptyTitle')}
            sub={t('ai.debrief.emptySub')}
          />
        )}

        {state.status === 'loading' && <PanelLoading label={t('ai.debrief.loadingLabel')} />}

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
              <p dir="auto" className="text-sm font-semibold text-slate-800 leading-snug">
                {state.data.headline}
              </p>
              <CopyButton text={state.data.markdown} label={t('ai.copyAll')} className="shrink-0" />
            </div>

            <div className="flex-1 overflow-auto space-y-4 pe-1">
              <Section title={t('ai.debrief.s.overview')}>
                <Prose>{state.data.overview}</Prose>
              </Section>

              {state.data.questionsAsked?.length > 0 && (
                <Section
                  title={t('ai.debrief.s.questions')}
                  hint={`${state.data.questionsAsked.length}`}
                >
                  <ul className="space-y-2">
                    {state.data.questionsAsked.map((q, i) => (
                      <li key={i} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                        <p dir="auto" className="text-sm font-medium text-slate-800 leading-snug">
                          {q.question}
                        </p>
                        {q.answerGiven && (
                          <p dir="auto" className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                            <span className="text-slate-400">{t('ai.debrief.youSaid')} </span>
                            {q.answerGiven}
                          </p>
                        )}
                        {q.assessment && (
                          <p dir="auto" className="text-2xs text-slate-500 mt-1 italic">{q.assessment}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <BulletList
                title={t('ai.debrief.s.unanswered')}
                hint={t('ai.debrief.s.unansweredHint')}
                items={state.data.unansweredQuestions}
              />
              <BulletList title={t('ai.debrief.s.learned')}   items={state.data.learnedAboutRole} />
              <BulletList title={t('ai.debrief.s.wentWell')}  items={state.data.wentWell} />
              <BulletList title={t('ai.debrief.s.improve')}   items={state.data.couldImprove} />
              <BulletList title={t('ai.debrief.s.signals')}   items={state.data.signalsRead} />
              <BulletList title={t('ai.debrief.s.nextSteps')} items={state.data.nextSteps} ordered />
              <BulletList title={t('ai.debrief.s.followUp')}  items={state.data.followUpActions} ordered />
              <BulletList title={t('ai.debrief.s.nextRound')} items={state.data.prepForNextRound} />
              <BulletList title={t('ai.debrief.s.topics')}    items={state.data.topicsCovered} />
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Button className="w-full" variant="outline" onClick={handleSave} loading={saving}>
                <Save className="w-4 h-4" />
                {t('ai.debrief.save')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
