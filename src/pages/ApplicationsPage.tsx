import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, LayoutGrid, List, Search, ChevronUp, ChevronDown, Trash2, Archive, ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StageBadge, PriorityBadge } from '@/components/ui/Badge'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { CompanyLogo } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableRowSkeleton, CardSkeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useMockStore } from '@/hooks/useMockStore'
import { useApplicationMutations } from '@/hooks/useApplicationMutations'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useI18n } from '@/hooks/useI18n'
import { applicationsService } from '@/services/applicationsService'
import { formatDate } from '@/utils/date'
import { matchesSearch } from '@/utils/search'
import { cn } from '@/lib/cn'
import { QK } from '@/lib/query-keys'
import type { JobApplication } from '@/types'
import type { ApplicationStage, Priority } from '@/lib/enums'
import { Briefcase } from 'lucide-react'

type SortKey = 'urgency' | 'fit' | 'applied' | 'company'

function SortHeader({ label, sortKey, currentSort, sortDir, onSort }: {
  label: string; sortKey: SortKey; currentSort: SortKey; sortDir: 'asc' | 'desc'; onSort: (k: SortKey) => void
}) {
  const active = currentSort === sortKey
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 uppercase tracking-wider"
    >
      {label}
      {active ? (
        sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      ) : (
        <ChevronDown className="w-3 h-3 opacity-30" />
      )}
    </button>
  )
}

/** Stages that take an application out of the live pipeline. */
const CLOSED_STAGES: ApplicationStage[] = ['Rejected', 'Accepted', 'Withdrawn']

export type ApplicationsPageMode = 'active' | 'archive'

/**
 * Renders both /applications and /applications/archive. The archive is the same
 * screen over the closed set rather than a separate page, so search, sorting and
 * the table/card toggle behave identically in both.
 */
export function ApplicationsPage({ mode = 'active' }: { mode?: ApplicationsPageMode } = {}) {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { data: apps, loading } = useMockStore(() => applicationsService.list(), [], { key: QK.applications.all() })
  const { remove } = useApplicationMutations()
  const [view, setView] = useState<'table' | 'card'>('table')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<ApplicationStage | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('')
  const [sortKey, setSortKey] = useState<SortKey>('urgency')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [deleteApp, setDeleteApp] = useState<JobApplication | null>(null)
  const debouncedSearch = useDebouncedValue(search)

  // Options defined inside component so labels re-render on locale change
  const STAGE_OPTIONS = [
    { label: t('pages.applications.allStages'), value: '' },
    { label: 'Interested',          value: 'Interested' },
    { label: 'Applied',             value: 'Applied' },
    { label: 'HR Screen',           value: 'HR Screen' },
    { label: 'Home Assignment',     value: 'Home Assignment' },
    { label: 'Technical Interview', value: 'Technical Interview' },
    { label: 'Manager Interview',   value: 'Manager Interview' },
    { label: 'Final Interview',     value: 'Final Interview' },
    { label: 'Offer',               value: 'Offer' },
    { label: 'Rejected',            value: 'Rejected' },
  ]

  const PRIORITY_OPTIONS = [
    { label: t('pages.applications.allPriorities'), value: '' },
    { label: 'Critical', value: 'Critical' },
    { label: 'High',     value: 'High' },
    { label: 'Medium',   value: 'Medium' },
    { label: 'Low',      value: 'Low' },
  ]

  const SORT_OPTIONS = [
    { label: t('pages.applications.sortUrgency'), value: 'urgency' },
    { label: t('pages.applications.sortFit'),     value: 'fit' },
    { label: t('pages.applications.sortApplied'), value: 'applied' },
    { label: t('pages.applications.sortCompany'), value: 'company' },
  ]

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const isArchive = mode === "archive"

  /** Applications belonging to this view before any user filtering. */
  const scoped = useMemo(() => {
    if (!apps) return []
    const closed = (a: JobApplication) => CLOSED_STAGES.includes(a.stage as ApplicationStage)
    return apps.filter(a => (isArchive ? closed(a) : !closed(a)))
  }, [apps, isArchive])

  const archivedCount = useMemo(
    () => (apps ?? []).filter(a => CLOSED_STAGES.includes(a.stage as ApplicationStage)).length,
    [apps],
  )

  const filtered = useMemo(() => {
    return scoped
      .filter(a => {
        if (stageFilter && a.stage !== stageFilter) return false
        if (priorityFilter && a.priority !== priorityFilter) return false
        if (!matchesSearch(a as unknown as Record<string, unknown>, debouncedSearch, ['companyName', 'roleName'])) return false
        return true
      })
      .sort((a, b) => {
        let diff = 0
        if (sortKey === 'urgency') diff = (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0)
        else if (sortKey === 'fit') diff = (b.fitScore ?? 0) - (a.fitScore ?? 0)
        else if (sortKey === 'applied') diff = new Date(b.appliedAt ?? 0).getTime() - new Date(a.appliedAt ?? 0).getTime()
        else if (sortKey === 'company') diff = a.companyName.localeCompare(b.companyName)
        return sortDir === 'asc' ? -diff : diff
      })
  }, [scoped, stageFilter, priorityFilter, debouncedSearch, sortKey, sortDir])

  const countLabel = filtered.length === 1
    ? t('pages.applications.countSingular', { count: filtered.length })
    : t('pages.applications.countPlural', { count: filtered.length })

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={isArchive ? 'Archive' : t('pages.applications.title')}
        description={isArchive ? `${countLabel} — closed, kept for reference` : countLabel}
        actions={
          <>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setView('table')}
                className={cn('px-3 py-2', view === 'table' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600')}
                aria-label="Table view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('card')}
                className={cn('px-3 py-2 border-s border-slate-200', view === 'card' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600')}
                aria-label="Card view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            {isArchive ? (
              <Link
                to="/applications"
                className="inline-flex items-center gap-2 h-9 px-3 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to pipeline
              </Link>
            ) : (
              <>
                {archivedCount > 0 && (
                  <Link
                    to="/applications/archive"
                    className="inline-flex items-center gap-2 h-9 px-3 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                    title="Applications that are closed or withdrawn"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                    <span className="text-xs text-slate-400">{archivedCount}</span>
                  </Link>
                )}
                <Button onClick={() => navigate('/applications/new')}>
                  <Plus className="w-4 h-4" />
                  {t('pages.applications.newApplication')}
                </Button>
              </>
            )}
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-48">
          <Input
            placeholder={t('pages.applications.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
            className="force-ltr"
          />
        </div>
        <Select
          options={STAGE_OPTIONS}
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value as ApplicationStage | '')}
          className="w-40"
        />
        <Select
          options={PRIORITY_OPTIONS}
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value as Priority | '')}
          className="w-36"
        />
        <Select
          options={SORT_OPTIONS}
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
          className="w-44"
        />
      </div>

      {loading ? (
        view === 'table' ? (
          <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <table className="w-full"><tbody>{Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)}</tbody></table>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )
      ) : filtered.length === 0 ? (
        isArchive ? (
          <EmptyState
            icon={Archive}
            title="Nothing archived yet"
            description="Applications you mark as rejected, withdrawn or accepted land here, out of the way of your live pipeline."
          />
        ) : (
          <EmptyState
            icon={Briefcase}
            title={t('pages.applications.noApplications')}
            description={t('pages.applications.noApplicationsSub')}
            action={{ label: t('pages.applications.newApplication'), onClick: () => navigate('/applications/new') }}
          />
        )
      ) : view === 'table' ? (
        <>
          {/* Table on md+, cards on mobile */}
          <div className="hidden md:block">
            <ApplicationTable apps={filtered} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} onDelete={setDeleteApp} t={t} />
          </div>
          <div className="md:hidden">
            <ApplicationGrid apps={filtered} />
          </div>
        </>
      ) : (
        <ApplicationGrid apps={filtered} />
      )}

      <ConfirmDialog
        open={!!deleteApp}
        onClose={() => setDeleteApp(null)}
        onConfirm={async () => {
          if (!deleteApp) return
          await remove.mutateAsync(deleteApp.id)
          setDeleteApp(null)
        }}
        title={t('pages.applications.deleteTitle')}
        description={`Remove "${deleteApp?.roleName} @ ${deleteApp?.companyName}" from your pipeline? This cannot be undone.`}
        confirmLabel={t('common.delete')}
        loading={remove.isPending}
      />
    </div>
  )
}

function ApplicationTable({ apps, sortKey, sortDir, onSort, onDelete, t }: {
  apps: JobApplication[]; sortKey: SortKey; sortDir: 'asc' | 'desc'; onSort: (k: SortKey) => void; onDelete: (a: JobApplication) => void; t: (key: string) => string
}) {
  return (
    <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('pages.applications.colCompanyRole')}</th>
              <th className="text-start px-4 py-3"><SortHeader label={t('pages.applications.colStage')} sortKey="urgency" currentSort={sortKey} sortDir={sortDir} onSort={() => {}} /></th>
              <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('pages.applications.colPriority')}</th>
              <th className="text-start px-4 py-3"><SortHeader label={t('pages.applications.colFit')} sortKey="fit" currentSort={sortKey} sortDir={sortDir} onSort={onSort} /></th>
              <th className="text-start px-4 py-3"><SortHeader label={t('pages.applications.colUrgency')} sortKey="urgency" currentSort={sortKey} sortDir={sortDir} onSort={onSort} /></th>
              <th className="text-start px-4 py-3"><SortHeader label={t('pages.applications.colApplied')} sortKey="applied" currentSort={sortKey} sortDir={sortDir} onSort={onSort} /></th>
              <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('pages.applications.colCv')}</th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {apps.map(app => (
              <tr key={app.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group">
                <td className="px-4 py-3">
                  <Link to={`/applications/${app.id}`} className="flex items-center gap-3">
                    <CompanyLogo name={app.companyName} size="sm" logoUrl={app.companyLogoUrl} />
                    <div>
                      <p className="text-sm font-medium text-slate-800 group-hover:text-primary-700 transition-colors">
                        {app.roleName}
                      </p>
                      <p className="text-xs text-slate-400">{app.companyName}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3"><StageBadge stage={app.stage} /></td>
                <td className="px-4 py-3"><PriorityBadge priority={app.priority} /></td>
                <td className="px-4 py-3">
                  {app.fitScore !== undefined && <ScoreRing score={app.fitScore} size="sm" />}
                </td>
                <td className="px-4 py-3">
                  {app.urgencyScore !== undefined && <ScoreRing score={app.urgencyScore} size="sm" />}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-slate-500 force-ltr">
                    {app.appliedAt ? formatDate(app.appliedAt, 'MMM d') : '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {app.submittedCvName ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-2xs font-medium text-slate-600 max-w-[120px] truncate force-ltr">
                      {app.submittedCvName}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={e => { e.preventDefault(); onDelete(app) }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-danger-50 text-slate-400 hover:text-danger-600 transition-all"
                    aria-label="Delete application"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ApplicationGrid({ apps }: { apps: JobApplication[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {apps.map(app => (
        <Link key={app.id} to={`/applications/${app.id}`}>
          <Card hover className="h-full">
            <div className="flex items-start gap-3 mb-3">
              <CompanyLogo name={app.companyName} size="md" logoUrl={app.companyLogoUrl} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{app.roleName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{app.companyName}</p>
              </div>
              <PriorityBadge priority={app.priority} />
            </div>
            <div className="flex items-center justify-between">
              <StageBadge stage={app.stage} />
              <div className="flex items-center gap-2">
                {app.fitScore !== undefined && <ScoreRing score={app.fitScore} label="Fit" size="sm" />}
                {app.urgencyScore !== undefined && <ScoreRing score={app.urgencyScore} label="Urgency" size="sm" />}
              </div>
            </div>
            {app.nextEventDescription && (
              <p className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-3">
                <span className="text-primary-600 font-medium">Next: </span>
                {app.nextEventDescription}
              </p>
            )}
          </Card>
        </Link>
      ))}
    </div>
  )
}
