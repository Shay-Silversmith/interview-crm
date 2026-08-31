// ---------------------------------------------------------------------------
// StarAnswersPanel — behavioural questions and STAR answers built from the
// candidate's real CV and the job description.
//
// Each answer shows the CV item it was built from. That is not decoration: an
// answer whose provenance is "no CV evidence" is an outline the candidate must
// fill in, and it has to be obvious which is which before they rehearse it.
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { Sparkles, User, Save, FileWarning } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useMockStore } from '@/hooks/useMockStore'
import { useCandidate } from '@/hooks/useCandidate'
import { useToastActions } from '@/hooks/useToast'
import { useI18n } from '@/hooks/useI18n'
import { applicationsService } from '@/services/applicationsService'
import { aiService, type AIRun } from '@/services/aiService'
import { AIFailureNotice } from './AIFailureNotice'
import { CopyButton, PanelEmpty, PanelLoading, ToolIntro } from './ResultBlocks'
import { cn } from '@/lib/cn'
import type { StarAnswer, StarAnswersResponse } from '@/services/aiClientService'

type RunState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done';  data: StarAnswersResponse }
  | { status: 'error'; run: Extract<AIRun<never>, { ok: false }> }

function answerToText(a: StarAnswer): string {
  return [
    a.question,
    '',
    `Situation: ${a.situation}`,
    `Task: ${a.task}`,
    `Action: ${a.action}`,
    `Result: ${a.result}`,
    '',
    a.spokenAnswer ? `Say it like this:\n${a.spokenAnswer}` : '',
  ].filter(Boolean).join('\n')
}

export function StarAnswersPanel() {
  const toast = useToastActions()
  const { t, locale } = useI18n()
  const { data: applications } = useMockStore(() => applicationsService.list())

  const [selectedAppId, setSelectedAppId] = useState('')
  const [cvOverride,    setCvOverride]    = useState('')
  const [role,          setRole]          = useState('')
  const [company,       setCompany]       = useState('')
  const [question,      setQuestion]      = useState('')
  const [focus,         setFocus]         = useState('')
  const [count,         setCount]         = useState(4)
  const [openIndex,     setOpenIndex]     = useState(0)
  const [saving,        setSaving]        = useState(false)
  const [state,         setState]         = useState<RunState>({ status: 'idle' })

  const selectedApp = applications?.find(a => a.id === selectedAppId)

  // Which CV the stories get built from, most specific first: an explicit
  // choice, then the CV actually submitted with this application, then the
  // active one. Without the middle step the tool silently wrote answers from
  // whichever CV happened to be flagged active — a different role's CV — which
  // is worse than no answer, because the stories look right.
  const { candidate, activeCV, cvVersions } = useCandidate(
    cvOverride || selectedApp?.submittedCvId,
  )

  const appCV = cvVersions.find(cv => cv.id === selectedApp?.submittedCvId)
  const cvInUse = cvVersions.find(cv => cv.id === cvOverride) ?? appCV ?? activeCV

  /** True when we fell back to the active CV because the app named none. */
  const cvIsGuess = !cvOverride && !appCV && !!cvInUse

  const handleAppSelect = (appId: string) => {
    setSelectedAppId(appId)
    setCvOverride('')
    const app = applications?.find(a => a.id === appId)
    if (app) {
      setRole(app.roleName)
      setCompany(app.companyName)
    }
  }

  const effectiveRole    = (selectedApp?.roleName ?? role).trim()
  const effectiveCompany = (selectedApp?.companyName ?? company).trim()
  const canRun = effectiveRole.length > 1 && effectiveCompany.length > 1

  const handleGenerate = async () => {
    if (!canRun) return
    setState({ status: 'loading' })
    setOpenIndex(0)

    const res = await aiService.starAnswers({
      role:      effectiveRole,
      company:   effectiveCompany,
      jdText:    selectedApp?.jobDescription || undefined,
      jdUrl:     selectedApp?.roleUrl || undefined,
      question:  question.trim() || undefined,
      focus:     focus.trim() || undefined,
      count,
      candidate,
      locale:    locale as 'en' | 'he',
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
      await aiService.saveSummary('Personalized Answer', state.data, {
        applicationId: selectedAppId || undefined,
        companyId:     selectedApp?.companyId,
        inputData:     { role: effectiveRole, company: effectiveCompany, question },
      })
      toast.success(t('ai.star.saved'))
    } catch (err) {
      toast.error(`${t('ai.star.saveFailed')} — ${err instanceof Error ? err.message : 'unknown error'}`)
    }
    setSaving(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ── Input ── */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center border bg-danger-50 border-danger-200 text-danger-700">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{t('ai.star.title')}</h2>
            <p className="text-xs text-slate-500">{t('ai.star.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <ToolIntro
            what={t('ai.star.introWhat')}
            how={[t('ai.star.introStep1'), t('ai.star.introStep2'), t('ai.star.introStep3')]}
          />

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.star.appLabel')}
            </label>
            <select
              value={selectedAppId}
              onChange={e => handleAppSelect(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">{t('ai.star.appPlaceholder')}</option>
              {(applications ?? []).map(app => (
                <option key={app.id} value={app.id}>{app.roleName} @ {app.companyName}</option>
              ))}
            </select>
          </div>

          {/* The tool is only as good as the CV behind it, and the wrong CV
              produces answers that look right and describe someone else's
              application. Name the one in play and let it be changed. */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.star.cvLabel')}
            </label>
            <select
              value={cvOverride}
              onChange={e => setCvOverride(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">
                {cvInUse
                  ? `${t('ai.star.cvAuto')} — ${cvInUse.name}`
                  : t('ai.star.cvAutoNone')}
              </option>
              {cvVersions.map(cv => (
                <option key={cv.id} value={cv.id}>
                  {cv.name}{cv.emphasis ? ` — ${cv.emphasis.slice(0, 45)}` : ''}
                </option>
              ))}
            </select>

            <div
              className={cn(
                'flex items-start gap-2 rounded-lg border px-3 py-2 text-2xs mt-1.5',
                !cvInUse    ? 'border-warning-200 bg-warning-50 text-warning-900' :
                cvIsGuess   ? 'border-warning-200 bg-warning-50 text-warning-900'
                            : 'border-success-200 bg-success-50 text-success-800',
              )}
            >
              <FileWarning className="w-3.5 h-3.5 shrink-0 mt-px" />
              <span>
                {!cvInUse
                  ? t('ai.star.noCV')
                  : cvOverride
                    ? `${t('ai.star.usingCV')} ${cvInUse.name}`
                    : appCV
                      ? `${t('ai.star.usingAppCV')} ${cvInUse.name}`
                      : `${t('ai.star.usingGuessCV')} ${cvInUse.name}`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t('ai.star.roleLabel')}<span className="text-danger-500 ms-0.5">*</span>
              </label>
              <input
                value={role}
                onChange={e => { setRole(e.target.value); setSelectedAppId('') }}
                placeholder="Data Engineer"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t('ai.star.companyLabel')}<span className="text-danger-500 ms-0.5">*</span>
              </label>
              <input
                value={company}
                onChange={e => { setCompany(e.target.value); setSelectedAppId('') }}
                placeholder="Amazon"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.star.questionLabel')} <span className="text-slate-400">({t('ai.jdParser.optional')})</span>
            </label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              dir="auto"
              rows={2}
              placeholder={t('ai.star.questionPlaceholder')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
            />
            <p className="text-2xs text-slate-400 mt-1">{t('ai.star.questionHint')}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t('ai.star.focusLabel')} <span className="text-slate-400">({t('ai.jdParser.optional')})</span>
              </label>
              <input
                value={focus}
                onChange={e => setFocus(e.target.value)}
                placeholder="Amazon Leadership Principles"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t('ai.star.countLabel')}
              </label>
              <select
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                disabled={question.trim().length > 0}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-50"
              >
                {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
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
            {state.status === 'loading' ? t('ai.star.writing') : t('ai.star.button')}
          </Button>
        </div>
      </Card>

      {/* ── Output ── */}
      <Card className="flex flex-col">
        {state.status === 'idle' && (
          <PanelEmpty icon={User} title={t('ai.star.emptyTitle')} sub={t('ai.star.emptySub')} />
        )}

        {state.status === 'loading' && <PanelLoading label={t('ai.star.loadingLabel')} />}

        {state.status === 'error' && (
          <AIFailureNotice
            reason={state.run.reason}
            message={state.run.message}
            onRetry={handleGenerate}
          />
        )}

        {state.status === 'done' && (
          <div className="flex flex-col gap-3 min-w-0">
            {state.data.coverageNote && (
              <div className="rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-900">
                {state.data.coverageNote}
              </div>
            )}

            <div className="flex-1 overflow-auto space-y-2 pe-1">
              {state.data.answers.map((a, i) => (
                <AnswerCard
                  key={i}
                  answer={a}
                  open={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
                  t={t}
                />
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Button className="w-full" variant="outline" onClick={handleSave} loading={saving}>
                <Save className="w-4 h-4" />
                {t('ai.star.save')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function AnswerCard({
  answer, open, onToggle, t,
}: {
  answer:   StarAnswer
  open:     boolean
  onToggle: () => void
  t:        (key: string) => string
}) {
  // "No CV evidence" is how the endpoint marks an outline rather than a real
  // story. Surfacing it as a badge is the difference between rehearsing your
  // own experience and rehearsing a stranger's.
  const isOutline = /no cv evidence/i.test(answer.basedOn)

  return (
    <div className="rounded-xl border border-slate-200 bg-surface overflow-hidden">
      <button onClick={onToggle} className="w-full text-start px-3.5 py-3 hover:bg-slate-50 transition-colors">
        <div className="flex items-start gap-2">
          <p dir="auto" className="flex-1 text-sm font-semibold text-slate-800 leading-snug">
            {answer.question}
          </p>
          {isOutline && (
            <span className="shrink-0 text-2xs font-bold px-1.5 py-0.5 rounded-full bg-warning-100 text-warning-700 border border-warning-200">
              {t('ai.star.outline')}
            </span>
          )}
        </div>
        {answer.whyAsked && (
          <p dir="auto" className="text-2xs text-slate-400 mt-1">{answer.whyAsked}</p>
        )}
      </button>

      {open && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 space-y-3">
          {answer.basedOn && (
            <p dir="auto" className="text-2xs text-slate-500">
              <span className="font-semibold">{t('ai.star.basedOn')} </span>{answer.basedOn}
            </p>
          )}

          <div className="space-y-2">
            {([
              ['S', t('ai.star.situation'), answer.situation],
              ['T', t('ai.star.task'),      answer.task],
              ['A', t('ai.star.action'),    answer.action],
              ['R', t('ai.star.result'),    answer.result],
            ] as const).map(([letter, label, text]) => (
              <div key={letter} className="flex gap-2.5">
                <span className="shrink-0 w-5 h-5 rounded-md bg-primary-100 text-primary-700 text-2xs font-bold flex items-center justify-center mt-0.5">
                  {letter}
                </span>
                <div className="min-w-0">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                  <p dir="auto" className="text-sm text-slate-700 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>

          {answer.spokenAnswer && (
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('ai.star.spoken')}
                </p>
                <CopyButton text={answer.spokenAnswer} />
              </div>
              <p dir="auto" className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {answer.spokenAnswer}
              </p>
            </div>
          )}

          {answer.deliveryTips?.length > 0 && (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                {t('ai.star.tips')}
              </p>
              <ul className="space-y-1">
                {answer.deliveryTips.map((tip, i) => (
                  <li key={i} dir="auto" className="text-xs text-slate-600 flex gap-1.5 leading-relaxed">
                    <span className="text-slate-300">•</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {answer.followUps?.length > 0 && (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                {t('ai.star.followUps')}
              </p>
              <ul className="space-y-1">
                {answer.followUps.map((q, i) => (
                  <li key={i} dir="auto" className="text-xs text-slate-600 flex gap-1.5 leading-relaxed">
                    <span className="text-slate-300">•</span>{q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <CopyButton text={answerToText(answer)} label={t('ai.star.copyAnswer')} />
        </div>
      )}
    </div>
  )
}
