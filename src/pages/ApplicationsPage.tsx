import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, LayoutGrid, List, Search, ChevronUp, ChevronDown } from 'lucide-react'
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
import { Modal } from '@/components/ui/Modal'
import { useMockStore } from '@/hooks/useMockStore'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { applicationsService } from '@/services/applicationsService'
import { formatDate } from '@/utils/date'
import { matchesSearch } from '@/utils/search'
import { cn } from '@/lib/cn'
import type { JobApplication } from '@/types'
import type { ApplicationStage, Priority } from '@/lib/enums'
import { Briefcase } from 'lucide-react'

const STAGE_OPTIONS = [
  { label: 'All Stages', value: '' },
  { label: 'Interested', value: 'Interested' },
  { label: 'Applied', value: 'Applied' },
  { label: 'HR Screen', value: 'HR Screen' },
  { label: 'Home Assignment', value: 'Home Assignment' },
  { label: 'Technical Interview', value: 'Technical Interview' },
  { label: 'Manager Interview', value: 'Manager Interview' },
  { label: 'Final Interview', value: 'Final Interview' },
  { label: 'Offer', value: 'Offer' },
  { label: 'Rejected', value: 'Rejected' },
]

const PRIORITY_OPTIONS = [
  { label: 'All Priorities', value: '' },
  { label: 'Critical', value: 'Critical' },
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' },
]

const SORT_OPTIONS = [
  { label: 'Urgency Score', value: 'urgency' },
  { label: 'Fit Score', value: 'fit' },
  { label: 'Applied Date', value: 'applied' },
  { label: 'Company Name', value: 'company' },
]

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

export function ApplicationsPage() {
  const { data: apps, loading } = useMockStore(() => applicationsService.list())
  const [view, setView] = useState<'table' | 'card'>('table')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<ApplicationStage | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('')
  const [sortKey, setSortKey] = useState<SortKey>('urgency')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [addOpen, setAddOpen] = useState(false)
  const debouncedSearch = useDebouncedValue(search)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    if (!apps) return []
    return apps
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
  }, [apps, stageFilter, priorityFilter, debouncedSearch, sortKey, sortDir])

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Applications"
        description={`${filtered.length} application${filtered.length !== 1 ? 's' : ''} in your pipeline`}
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
                className={cn('px-3 py-2 border-l border-slate-200', view === 'card' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600')}
                aria-label="Card view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" />
              New Application
            </Button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Search applications…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
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
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <table className="w-full"><tbody>{Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)}</tbody></table>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No applications found"
          description="Try adjusting your filters, or add your first application."
          action={{ label: 'New Application', onClick: () => setAddOpen(true) }}
        />
      ) : view === 'table' ? (
        <>
          {/* Table on md+, cards on mobile */}
          <div className="hidden md:block">
            <ApplicationTable apps={filtered} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          </div>
          <div className="md:hidden">
            <ApplicationGrid apps={filtered} />
          </div>
        </>
      ) : (
        <ApplicationGrid apps={filtered} />
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New Application"
        description="Coming in Phase 5 — full CRUD will be wired to Supabase."
      >
        <p className="text-sm text-slate-500">
          Application creation will be available once the backend is connected. For now, mock data reflects your real pipeline.
        </p>
        <Button variant="secondary" className="mt-4 w-full" onClick={() => setAddOpen(false)}>Close</Button>
      </Modal>
    </div>
  )
}

function ApplicationTable({ apps, sortKey, sortDir, onSort }: {
  apps: JobApplication[]; sortKey: SortKey; sortDir: 'asc' | 'desc'; onSort: (k: SortKey) => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company / Role</th>
              <th className="text-left px-4 py-3"><SortHeader label="Stage" sortKey="urgency" currentSort={sortKey} sortDir={sortDir} onSort={() => {}} /></th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
              <th className="text-left px-4 py-3"><SortHeader label="Fit" sortKey="fit" currentSort={sortKey} sortDir={sortDir} onSort={onSort} /></th>
              <th className="text-left px-4 py-3"><SortHeader label="Urgency" sortKey="urgency" currentSort={sortKey} sortDir={sortDir} onSort={onSort} /></th>
              <th className="text-left px-4 py-3"><SortHeader label="Applied" sortKey="applied" currentSort={sortKey} sortDir={sortDir} onSort={onSort} /></th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">CV</th>
            </tr>
          </thead>
          <tbody>
            {apps.map(app => (
              <tr key={app.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group">
                <td className="px-4 py-3">
                  <Link to={`/applications/${app.id}`} className="flex items-center gap-3">
                    <CompanyLogo name={app.companyName} size="sm" />
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
                  <span className="text-xs text-slate-500">
                    {app.appliedAt ? formatDate(app.appliedAt, 'MMM d') : '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {app.submittedCvName ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-2xs font-medium text-slate-600 max-w-[120px] truncate">
                      {app.submittedCvName}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
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
              <CompanyLogo name={app.companyName} size="md" />
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
