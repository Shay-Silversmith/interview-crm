import { useState, useMemo } from 'react'
import { BookOpen, Edit2, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useMockStore } from '@/hooks/useMockStore'
import { prepService } from '@/services/prepService'
import { formatDate } from '@/utils/date'
import { cn } from '@/lib/cn'
import type { PrepCategory } from '@/lib/enums'
import type { PreparedAnswer } from '@/types'

const CATEGORIES: PrepCategory[] = [
  'Personal Pitch', 'HR', 'Behavioral', 'STAR', 'Technical',
  'Product / PM', 'SQL', 'Python', 'Data Engineering', 'Information Systems',
]

const CONFIDENCE_LABELS: Record<number, string> = {
  1: 'Very shaky', 2: 'Needs work', 3: 'Getting there', 4: 'Solid', 5: 'Confident',
}

const CONFIDENCE_COLOR: Record<number, 'danger' | 'warning' | 'warning' | 'primary' | 'success'> = {
  1: 'danger', 2: 'warning', 3: 'warning', 4: 'primary', 5: 'success',
}

export function PrepPage() {
  const { data: answers, loading } = useMockStore(() => prepService.list())
  const [activeCategory, setActiveCategory] = useState<PrepCategory>('Personal Pitch')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(
    () => answers?.filter(a => a.category === activeCategory) ?? [],
    [answers, activeCategory]
  )

  const categoryStats = useMemo(() => {
    const stats: Record<PrepCategory, { total: number; ready: number }> = {} as Record<PrepCategory, { total: number; ready: number }>
    CATEGORIES.forEach(c => { stats[c] = { total: 0, ready: 0 } })
    answers?.forEach(a => {
      stats[a.category].total++
      if (a.isReady) stats[a.category].ready++
    })
    return stats
  }, [answers])

  const overallReady = answers?.filter(a => a.isReady).length ?? 0
  const overallTotal = answers?.length ?? 0

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Interview Prep Hub"
        description="Build your answer library"
        actions={
          <Button variant="outline" size="sm" disabled>
            <Sparkles className="w-4 h-4" />
            Generate with AI (Phase 7)
          </Button>
        }
      />

      {/* Overall progress */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700">Overall Readiness</p>
          <span className="text-sm font-bold text-slate-800">{overallReady}/{overallTotal} ready</span>
        </div>
        <ProgressBar
          value={overallTotal > 0 ? Math.round((overallReady / overallTotal) * 100) : 0}
          color={overallReady / overallTotal >= 0.8 ? 'success' : overallReady / overallTotal >= 0.5 ? 'primary' : 'warning'}
          showValue
        />
      </div>

      <div className="flex gap-4 min-h-[600px]">
        {/* Left rail - categories */}
        <div className="w-52 shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-2 sticky top-4">
            {CATEGORIES.map(cat => {
              const stats = categoryStats[cat]
              const isActive = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 font-medium'
                  )}
                >
                  <span className="truncate">{cat}</span>
                  {stats.total > 0 && (
                    <span className={cn(
                      'text-2xs font-bold px-1.5 py-0.5 rounded-full ml-2 shrink-0',
                      stats.ready === stats.total
                        ? 'bg-success-100 text-success-700'
                        : 'bg-slate-100 text-slate-500'
                    )}>
                      {stats.ready}/{stats.total}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Mobile category picker */}
        <div className="md:hidden w-full mb-4">
          <select
            value={activeCategory}
            onChange={e => setActiveCategory(e.target.value as PrepCategory)}
            className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700">{activeCategory}</h2>
            <span className="text-xs text-slate-400">{filtered.length} answer{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No answers in this category"
              description="Add your first answer or generate one with AI."
              action={{ label: 'Add Answer', onClick: () => {} }}
            />
          ) : (
            <div className="space-y-3">
              {filtered.map(answer => (
                <AnswerCard
                  key={answer.id}
                  answer={answer}
                  expanded={expandedId === answer.id}
                  onToggle={() => setExpandedId(expandedId === answer.id ? null : answer.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AnswerCard({ answer, expanded, onToggle }: {
  answer: PreparedAnswer; expanded: boolean; onToggle: () => void
}) {
  return (
    <div className={cn('bg-white rounded-2xl border shadow-card transition-all', answer.isReady ? 'border-success-200/80' : 'border-slate-200/80')}>
      <button className="w-full flex items-start gap-4 p-4 text-left" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800 leading-snug">{answer.question}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              {answer.isReady ? (
                <ToggleRight className="w-5 h-5 text-success-500" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-slate-300" />
              )}
              <span className={cn('text-2xs font-medium', answer.isReady ? 'text-success-600' : 'text-slate-400')}>
                {answer.isReady ? 'Ready' : 'Not ready'}
              </span>
            </div>
          </div>
          {!expanded && (
            <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {answer.answer.slice(0, 150)}…
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
            <span className="text-2xs text-slate-400">{CONFIDENCE_LABELS[answer.confidence]}</span>
            <span className="text-2xs text-slate-300 ml-auto">Updated {formatDate(answer.lastUpdatedAt)}</span>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{answer.answer}</p>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
            <Button variant="outline" size="sm" disabled>
              <Edit2 className="w-3.5 h-3.5" />
              Edit (Phase 5)
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <Sparkles className="w-3.5 h-3.5" />
              Regenerate with AI
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
