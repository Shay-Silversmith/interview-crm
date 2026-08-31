// ---------------------------------------------------------------------------
// PrepAnswerForm — drawer form for create / edit interview prep answers.
//
// Three things sit on top of the plain form, in the order people actually work:
//   1. Pick a question from the bank, because a blank "Question" field is the
//      point at which most people close the drawer.
//   2. Write a rough answer, then have it restructured into STAR — an editor
//      pass over what they actually did.
//   3. Or, with nothing written, draft one from the CV.
//
// The bank is static, so browsing questions costs nothing against the Gemini
// daily quota. Only the two AI actions spend a request, and each spends one.
// ---------------------------------------------------------------------------
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles, Wand2, ListChecks, ChevronDown, X } from 'lucide-react'
import type { PreparedAnswer } from '@/types'
import type { PrepCategory, RoleFamily } from '@/lib/enums'
import { makePrepAnswerSchema, type PrepAnswerFormValues } from '@/lib/schemas/prepAnswerSchema'
import { TextField, SelectField, TextareaField, CheckboxField } from './Field'
import { SubmitBar } from './FormLayout'
import { useI18n } from '@/hooks/useI18n'
import { useCandidate } from '@/hooks/useCandidate'
import { useToastActions } from '@/hooks/useToast'
import { aiService, type AIRun } from '@/services/aiService'
import { AIFailureNotice } from '@/components/ai/AIFailureNotice'
import { questionsFor, ROLE_FAMILIES } from '@/data/question-bank'
import { cn } from '@/lib/cn'

interface PrepAnswerFormProps {
  initial?: Partial<PreparedAnswer>
  onSubmit: (values: PrepAnswerFormValues) => Promise<void> | void
  onCancel: () => void
  loading?: boolean
}

type AIMode = 'rewrite' | 'fromCV'

export function PrepAnswerForm({ initial, onSubmit, onCancel, loading }: PrepAnswerFormProps) {
  const { t, locale } = useI18n()
  const toast = useToastActions()
  const [cvId, setCvId] = useState('')
  // Which CV the answer is built from is a real choice — a data CV and a
  // product CV produce different stories for the same question — so it is
  // picked here rather than silently defaulting to whichever is active.
  const { candidate, activeCV, cvVersions } = useCandidate(cvId || undefined)

  const schema = useMemo(() => makePrepAnswerSchema(t), [t])

  const CATEGORY_OPTS = [
    { value: 'Phone Screen',     label: t('pages.prep.categories.Phone Screen') },
    { value: 'Professional',     label: t('pages.prep.categories.Professional') },
    { value: 'Home Assignment',  label: t('pages.prep.categories.Home Assignment') },
    { value: 'Manager',          label: t('pages.prep.categories.Manager') },
    { value: 'HR / Personality', label: t('pages.prep.categories.HR / Personality') },
    { value: 'Other',            label: t('pages.prep.categories.Other') },
  ]

  const CONFIDENCE_LABELS: Record<number, string> = {
    1: t('forms.options.confidence1'),
    2: t('forms.options.confidence2'),
    3: t('forms.options.confidence3'),
    4: t('forms.options.confidence4'),
    5: t('forms.options.confidence5'),
  }

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PrepAnswerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      question:   initial?.question ?? '',
      category:   initial?.category ?? 'Phone Screen',
      answer:     initial?.answer ?? '',
      confidence: initial?.confidence ?? 3,
      isReady:    initial?.isReady ?? false,
      tags:       initial?.tags?.join(', ') ?? '',
    },
  })

  const confidence = watch('confidence')
  const isReady    = watch('isReady')
  const category   = watch('category') as PrepCategory
  const question   = watch('question')
  const answer     = watch('answer')

  // Only offer the bank on a new entry — reopening a saved answer to a list of
  // other questions is noise.
  const [bankOpen, setBankOpen] = useState(!initial?.id && !initial?.question)
  const [roleFamily, setRoleFamily] = useState<RoleFamily>('Software Engineering')

  // The professional round is the only one where the discipline changes the
  // questions; the others are the same whatever the job is.
  const bank = questionsFor(category, roleFamily)

  // STAR is how you answer a story question, not a kind of question — so it
  // decides the SHAPE of the generated answer, not whether the helper runs.
  // Gating the buttons on it left every phone-screen question with nothing to
  // click, which is the opposite of helpful.
  const matched  = bank.find(q => q.question === question?.trim())
  const starFits = matched ? matched.star === true : true
  const style: 'star' | 'direct' = starFits ? 'star' : 'direct'

  const [busy,    setBusy]    = useState<AIMode | null>(null)
  const [failure, setFailure] = useState<Extract<AIRun<never>, { ok: false }> | null>(null)

  const runAI = async (mode: AIMode) => {
    if (!question?.trim()) {
      toast.error(t('forms.prepAI.needQuestion'))
      return
    }
    setBusy(mode)
    setFailure(null)

    const res = await aiService.starAnswers({
      // The prep bank is not tied to one application, so the role and company
      // come from the profile's target rather than a specific posting.
      role:        candidate?.targetRoles?.[0] ?? 'the role I am targeting',
      company:     t('forms.prepAI.genericCompany'),
      question:    question.trim(),
      draftAnswer: mode === 'rewrite' ? answer?.trim() : undefined,
      answerStyle: style,
      count:       1,
      candidate,
      locale:      locale as 'en' | 'he',
    })

    setBusy(null)

    if (!res.ok) {
      setFailure(res)
      return
    }

    const first = res.data.answers[0]
    if (!first) {
      toast.error(t('forms.prepAI.empty'))
      return
    }

    // The spoken version is what gets rehearsed, so it leads. The STAR
    // breakdown follows only when there is one — a direct answer has empty
    // STAR fields, and printing four empty labels would be noise.
    const hasStar = [first.situation, first.task, first.action, first.result]
      .some(v => v?.trim())

    const composed = [
      first.spokenAnswer?.trim() || '',
      ...(hasStar
        ? [
            '',
            `${t('forms.prepAI.situation')}: ${first.situation}`,
            `${t('forms.prepAI.task')}: ${first.task}`,
            `${t('forms.prepAI.action')}: ${first.action}`,
            `${t('forms.prepAI.result')}: ${first.result}`,
          ]
        : []),
    ].join('\n').trim()

    setValue('answer', composed, { shouldDirty: true })

    if (res.data.coverageNote) {
      toast.info(res.data.coverageNote)
    } else {
      toast.success(mode === 'rewrite'
        ? t('forms.prepAI.rewritten')
        : t('forms.prepAI.drafted'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* ── Question bank ── */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden">
        <button
          type="button"
          onClick={() => setBankOpen(o => !o)}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 text-start hover:bg-slate-100/70 transition-colors"
        >
          <ListChecks className="w-4 h-4 text-primary-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 flex-1">
            {t('forms.prepAI.bankTitle')}
            <span className="font-normal text-slate-400"> · {bank.length}</span>
          </span>
          <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', bankOpen && 'rotate-180')} />
        </button>

        {bankOpen && (
          <div className="border-t border-slate-200 max-h-64 overflow-y-auto">
            {bank.length === 0 ? (
              <p className="px-3.5 py-3 text-xs text-slate-400">{t('forms.prepAI.bankEmpty')}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {bank.map(item => (
                  <li key={item.question}>
                    <button
                      type="button"
                      onClick={() => {
                        setValue('question', item.question, { shouldDirty: true })
                        setBankOpen(false)
                      }}
                      className="w-full text-start px-3.5 py-2.5 hover:bg-white transition-colors"
                    >
                      <p dir="auto" className="text-xs font-medium text-slate-800 leading-snug">
                        {item.question}
                        {item.star && (
                          <span className="ms-1.5 align-middle text-2xs font-bold px-1 py-0.5 rounded bg-violet-100 text-violet-700">
                            STAR
                          </span>
                        )}
                      </p>
                      <p dir="auto" className="text-2xs text-slate-400 mt-0.5 leading-snug">
                        {item.why}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {category === 'Professional' && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            {t('forms.prepAI.roleFamily')}
          </label>
          <select
            value={roleFamily}
            onChange={e => setRoleFamily(e.target.value as RoleFamily)}
            className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            {ROLE_FAMILIES.map(f => (
              <option key={f} value={f}>{t(`forms.prepAI.roles.${f}`)}</option>
            ))}
          </select>
          <p className="text-2xs text-slate-400 mt-1">{t('forms.prepAI.roleFamilyHint')}</p>
        </div>
      )}

      <TextareaField
        label={t('forms.fields.question')} required
        placeholder="Tell me about yourself…"
        rows={3}
        error={errors.question?.message}
        {...register('question')}
      />
      <SelectField label={t('forms.fields.category')} required options={CATEGORY_OPTS} error={errors.category?.message} {...register('category')} />

      <TextareaField
        label={t('forms.fields.answer')}
        placeholder={t('forms.prepAI.answerPlaceholder')}
        rows={8}
        className="min-h-[160px]"
        error={errors.answer?.message}
        {...register('answer')}
      />

      {/* ── AI actions ── */}
      <div className="rounded-xl border border-violet-200 bg-violet-50/50 px-3.5 py-3 space-y-2.5">
        <p className="text-2xs font-bold uppercase tracking-wide text-violet-700">
          {t('forms.prepAI.title')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => runAI('rewrite')}
            disabled={busy !== null || !answer?.trim()}
            className={cn(
              'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-start transition-colors',
              'bg-surface border-slate-200 hover:border-violet-300 disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            <Wand2 className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-slate-800">
                {busy === 'rewrite' ? t('forms.prepAI.working') : t('forms.prepAI.rewriteTitle')}
              </span>
              <span className="block text-2xs text-slate-500 leading-snug mt-0.5">
                {t('forms.prepAI.rewriteDesc')}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => runAI('fromCV')}
            disabled={busy !== null}
            className={cn(
              'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-start transition-colors',
              'bg-surface border-slate-200 hover:border-violet-300 disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-slate-800">
                {busy === 'fromCV' ? t('forms.prepAI.working') : t('forms.prepAI.fromCVTitle')}
              </span>
              <span className="block text-2xs text-slate-500 leading-snug mt-0.5">
                {t('forms.prepAI.fromCVDesc')}
              </span>
            </span>
          </button>
        </div>

        <p className="text-2xs text-slate-500">
          {starFits ? t('forms.prepAI.willUseStar') : t('forms.prepAI.willUseDirect')}
        </p>

        {/* Which CV the answer is drawn from. */}
        <div>
          <label className="block text-2xs font-medium text-slate-600 mb-1">
            {t('forms.prepAI.cvLabel')}
          </label>
          <select
            value={cvId}
            onChange={e => setCvId(e.target.value)}
            className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-surface text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <option value="">
              {activeCV
                ? `${t('forms.prepAI.cvAuto')} — ${activeCV.name}`
                : t('forms.prepAI.noCV')}
            </option>
            {cvVersions.map(cv => (
              <option key={cv.id} value={cv.id}>
                {cv.name}{cv.emphasis ? ` — ${cv.emphasis.slice(0, 45)}` : ''}
              </option>
            ))}
          </select>
        </div>

        {failure && (
          <div className="relative">
            <AIFailureNotice reason={failure.reason} message={failure.message} />
            <button
              type="button"
              onClick={() => setFailure(null)}
              aria-label={t('common.close')}
              className="absolute top-1.5 end-1.5 p-1 rounded text-warning-700/60 hover:text-warning-900"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Confidence slider */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">
          {t('forms.fields.confidence')} — <span className="font-semibold text-slate-800">{CONFIDENCE_LABELS[confidence ?? 3]}</span>
        </label>
        <div className="flex gap-2">
          {([1, 2, 3, 4, 5] as const).map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setValue('confidence', n)}
              className={cn(
                'flex-1 h-8 rounded-lg text-sm font-medium border transition-colors',
                confidence === n
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-surface text-slate-500 border-slate-200 hover:border-primary-300'
              )}
            >
              {n}
            </button>
          ))}
        </div>
        {errors.confidence && <p className="text-xs text-danger-600">{errors.confidence.message}</p>}
      </div>

      <CheckboxField
        label={t('forms.fields.markAsReady')}
        description={t('forms.fields.markAsReadyDesc')}
        checked={isReady}
        onChange={v => setValue('isReady', v)}
      />

      <TextField
        label={t('forms.fields.tags')}
        placeholder="leadership, amazon, LP1"
        hint={t('forms.hints.commaSeparated')}
        error={errors.tags?.message}
        {...register('tags')}
      />

      <SubmitBar
        submitLabel={initial?.id ? t('forms.actions.save') : t('forms.actions.addAnswer')}
        onCancel={onCancel}
        loading={loading}
      />
    </form>
  )
}
