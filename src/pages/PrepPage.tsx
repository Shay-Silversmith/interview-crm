import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ToggleLeft, ToggleRight, Plus, Edit2, Trash2, Sparkles, ChevronDown } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PrepAnswerForm } from '@/components/forms/PrepAnswerForm'
import { useMockStore } from '@/hooks/useMockStore'
import { usePrepMutations } from '@/hooks/usePrepMutations'
import { useI18n } from '@/hooks/useI18n'
import { prepService } from '@/services/prepService'
import { formatDate } from '@/utils/date'
import { cn } from '@/lib/cn'
import { QK } from '@/lib/query-keys'
import type { PrepCategory, ConfidenceLevel } from '@/lib/enums'
import type { PreparedAnswer } from '@/types'
import type { PrepAnswerFormValues } from '@/lib/schemas/prepAnswerSchema'

const CATEGORIES: PrepCategory[] = [
  'Personal Pitch', 'HR', 'Behavioral', 'STAR', 'Technical',
  'Product / PM', 'SQL', 'Python', 'Data Engineering', 'Information Systems',
]

const CONFIDENCE_COLOR: Record<number, 'danger' | 'warning' | 'primary' | 'success'> = {
  1: 'danger', 2: 'warning', 3: 'warning', 4: 'primary', 5: 'success',
}

const EXPLAINER_DISMISSED = 'interviewflow.prepExplainerDismissed'

export function PrepPage() {
  const { t } = useI18n()
  const { data: answers, loading } = useMockStore(() => prepService.list(), [], { key: QK.prep.all() })
  const { create, update, remove } = usePrepMutations()

  const [activeCategory, setActiveCategory] = useState<PrepCategory>('Personal Pitch')
  const [expandedId,     setExpandedId]     = useState<string | null>(null)
  const [addOpen,        setAddOpen]        = useState(false)
  const [editAnswer,     setEditAnswer]     = useState<PreparedAnswer | null>(null)
  const [deleteAnswer,   setDeleteAnswer]   = useState<PreparedAnswer | null>(null)

  // The explainer is the whole reason this page makes sense on first visit, so
  // it shows by default — but it is noise once you know, hence the dismissal.
  const [explainerOpen, setExplainerOpen] = useState(() => {
    try { return localStorage.getItem(EXPLAINER_DISMISSED) !== 'true' } catch { return true }
  })

  const toggleExplainer = () => {
    setExplainerOpen(open => {
      try { localStorage.setItem(EXPLAINER_DISMISSED, open ? 'true' : 'false') } catch { /* ignore */ }
      return !open
    })
  }

  const filtered = useMemo(
    () => answers?.filter(a => a.category === activeCategory) ?? [],
    [answers, activeCategory],
  )

  const categoryStats = useMemo(() => {
    const stats = {} as Record<PrepCategory, { total: number; ready: number }>
    CATEGORIES.forEach(c => { stats[c] = { total: 0, ready: 0 } })
    answers?.forEach(a => {
      // A category that is not in the list would throw on the increment below.
      if (!stats[a.category]) stats[a.category] = { total: 0, ready: 0 }
      stats[a.category].total++
      if (a.isReady) stats[a.category].ready++
    })
    return stats
  }, [answers])

  const overallReady = answers?.filter(a => a.isReady).length ?? 0
  const overallTotal = answers?.length ?? 0
  const readyRatio   = overallTotal > 0 ? overallReady / overallTotal : 0

  const handleCreate = async (values: PrepAnswerFormValues) => {
    await create.mutateAsync({
      question:   values.question,
      category:   values.category,
      answer:     values.answer,
      confidence: values.confidence as ConfidenceLevel,
      isReady:    values.isReady,
      tags:       values.tags ? values.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
    })
    setAddOpen(false)
    setActiveCategory(values.category)
  }

  const handleEdit = async (values: PrepAnswerFormValues) => {
    if (!editAnswer) return
    await update.mutateAsync({
      id: editAnswer.id,
      data: {
        question:   values.question,
        category:   values.category,
        answer:     values.answer,
        confidence: values.confidence as ConfidenceLevel,
        isReady:    values.isReady,
        tags:       values.tags ? values.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      },
    })
    setEditAnswer(null)
  }

  const handleDelete = async () => {
    if (!deleteAnswer) return
    await remove.mutateAsync(deleteAnswer.id)
    setDeleteAnswer(null)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={t('pages.prep.title')}
        description={t('pages.prep.subtitle')}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            {t('pages.prep.addAnswer')}
          </Button>
        }
      />

      {/* What this page is for */}
      <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-card mb-4 overflow-hidden">
        <button
          onClick={toggleExplainer}
          className="w-full flex items-center justify-between gap-3 px-5 py-3 text-start hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-600 shrink-0" />
            <span className="text-sm font-semibold text-slate-800">
              {t('pages.prep.explainerTitle')}
            </span>
          </span>
          <ChevronDown
            className={cn('w-4 h-4 text-slate-400 transition-transform shrink-0', explainerOpen && 'rotate-180')}
          />
        </button>

        {explainerOpen && (
          <div className="px-5 pb-4 pt-1 border-t border-slate-100 space-y-3">
            <p dir="auto" className="text-sm text-slate-600 leading-relaxed">
              {t('pages.prep.explainerBody')}
            </p>
            <ol className="space-y-1.5">
              {[
                t('pages.prep.explainerStep1'),
                t('pages.prep.explainerStep2'),
                t('pages.prep.explainerStep3'),
              ].map((step, i) => (
                <li key={i} dir="auto" className="flex gap-2.5 text-xs text-slate-500 leading-relaxed">
                  <span className="shrink-0 w-4 h-4 rounded-md bg-primary-100 text-primary-700 text-2xs font-bold flex items-center justify-center mt-px">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <Link
              to="/ai?tool=personalized"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t('pages.prep.explainerCta')}
            </Link>
          </div>
        )}
      </div>

      {/* Readiness */}
      <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-card p-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700">{t('pages.prep.readinessLabel')}</p>
          <span className="text-sm font-bold text-slate-800">
            {overallTotal === 0
              ? t('pages.prep.readyNone')
              : t('pages.prep.readyCount')
                  .replace('{{ready}}', String(overallReady))
                  .replace('{{total}}', String(overallTotal))}
          </span>
        </div>
        <ProgressBar
          value={Math.round(readyRatio * 100)}
          color={readyRatio >= 0.8 ? 'success' : readyRatio >= 0.5 ? 'primary' : 'warning'}
          showValue
        />
      </div>

      <div className="flex gap-4 min-h-[600px]">
        {/* Categories */}
        <div className="w-52 shrink-0 hidden md:block">
          <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-card p-2 sticky top-4">
            {CATEGORIES.map(cat => {
              const stats = categoryStats[cat]
              const isActive = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-start text-sm transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 font-medium',
                  )}
                >
                  <span className="truncate">{t(`pages.prep.categories.${cat}`)}</span>
                  {stats.total > 0 && (
                    <span className={cn(
                      'text-2xs font-bold px-1.5 py-0.5 rounded-full ms-2 shrink-0',
                      stats.ready === stats.total
                        ? 'bg-success-100 text-success-700'
                        : 'bg-slate-100 text-slate-500',
                    )}>
                      {stats.ready}/{stats.total}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="md:hidden w-full mb-4">
          <select
            value={activeCategory}
            onChange={e => setActiveCategory(e.target.value as PrepCategory)}
            className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{t(`pages.prep.categories.${c}`)}</option>
            ))}
          </select>
        </div>

        {/* Answers */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700">
              {t(`pages.prep.categories.${activeCategory}`)}
            </h2>
            <span className="text-xs text-slate-400">
              {filtered.length === 1
                ? t('pages.prep.answersCountOne')
                : t('pages.prep.answersCount').replace('{{count}}', String(filtered.length))}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={t('pages.prep.noAnswers')}
              description={t('pages.prep.noAnswersSub')}
              action={{ label: t('pages.prep.addAnswer'), onClick: () => setAddOpen(true) }}
            />
          ) : (
            <div className="space-y-3">
              {filtered.map(answer => (
                <AnswerCard
                  key={answer.id}
                  answer={answer}
                  expanded={expandedId === answer.id}
                  onToggle={() => setExpandedId(expandedId === answer.id ? null : answer.id)}
                  onEdit={() => setEditAnswer(answer)}
                  onDelete={() => setDeleteAnswer(answer)}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Drawer open={addOpen} onClose={() => setAddOpen(false)} title={t('pages.prep.addAnswer')}>
        <PrepAnswerForm
          initial={{ category: activeCategory }}
          onSubmit={handleCreate}
          onCancel={() => setAddOpen(false)}
          loading={create.isPending}
        />
      </Drawer>

      <Drawer open={!!editAnswer} onClose={() => setEditAnswer(null)} title={t('common.edit')}>
        {editAnswer && (
          <PrepAnswerForm
            initial={editAnswer}
            onSubmit={handleEdit}
            onCancel={() => setEditAnswer(null)}
            loading={update.isPending}
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleteAnswer}
        onClose={() => setDeleteAnswer(null)}
        onConfirm={handleDelete}
        title={`${t('common.delete')}?`}
        description={t('pages.prep.deleteConfirm')}
        confirmLabel={t('common.delete')}
        loading={remove.isPending}
      />
    </div>
  )
}

function AnswerCard({ answer, expanded, onToggle, onEdit, onDelete, t }: {
  answer:   PreparedAnswer
  expanded: boolean
  onToggle: () => void
  onEdit:   () => void
  onDelete: () => void
  t: (key: string) => string
}) {
  return (
    <div className={cn(
      'bg-surface rounded-2xl border shadow-card transition-all',
      answer.isReady ? 'border-success-200/80' : 'border-slate-200/80',
    )}>
      <button className="w-full flex items-start gap-4 p-4 text-start" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p dir="auto" className="text-sm font-semibold text-slate-800 leading-snug">
              {answer.question}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {answer.isReady
                ? <ToggleRight className="w-5 h-5 text-success-500" />
                : <ToggleLeft className="w-5 h-5 text-slate-300" />}
              <span className={cn('text-2xs font-medium', answer.isReady ? 'text-success-600' : 'text-slate-400')}>
                {answer.isReady ? t('pages.prep.ready') : t('pages.prep.notReady')}
              </span>
            </div>
          </div>

          {!expanded && (
            <p dir="auto" className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {answer.answer.slice(0, 150)}
              {answer.answer.length > 150 ? '…' : ''}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2">
            <div className="flex-1 max-w-32">
              <ProgressBar
                value={answer.confidence}
                max={5}
                color={CONFIDENCE_COLOR[answer.confidence]}
                size="sm"
              />
            </div>
            <span className="text-2xs text-slate-400">
              {t(`pages.prep.confidence.${answer.confidence}`)}
            </span>
            <span className="text-2xs text-slate-300 ms-auto">
              {t('pages.prep.updated')} {formatDate(answer.lastUpdatedAt)}
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-4">
          <p dir="auto" className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {answer.answer}
          </p>

          {answer.tags && answer.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {answer.tags.map(tag => (
                <span key={tag} className="text-2xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit2 className="w-3.5 h-3.5" />
              {t('pages.prep.edit')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-danger-600 hover:bg-danger-50">
              <Trash2 className="w-3.5 h-3.5" />
              {t('pages.prep.delete')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
