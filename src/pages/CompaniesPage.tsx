import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Search, Star } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { CompanyLogo } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useMockStore } from '@/hooks/useMockStore'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { companiesService } from '@/services/companiesService'
import { applicationsService } from '@/services/applicationsService'
import { matchesSearch } from '@/utils/search'

export function CompaniesPage() {
  const { data: companies, loading } = useMockStore(() => companiesService.list())
  const { data: apps } = useMockStore(() => applicationsService.list())
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const filtered = useMemo(() => {
    if (!companies) return []
    return companies.filter(c =>
      matchesSearch(c as unknown as Record<string, unknown>, debouncedSearch, ['name', 'industry', 'location'])
    )
  }, [companies, debouncedSearch])

  const appCountByCompany = useMemo(() => {
    const map: Record<string, number> = {}
    apps?.forEach(a => { map[a.companyId] = (map[a.companyId] ?? 0) + 1 })
    return map
  }, [apps])

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Companies"
        description="Track companies you're targeting"
      />
      <div className="mb-5">
        <Input
          placeholder="Search companies…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={<Search className="w-3.5 h-3.5" />}
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No companies found" description="Add companies you're interested in." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(company => (
            <Link key={company.id} to={`/companies/${company.id}`}>
              <Card hover className="h-full">
                <div className="flex items-start gap-3 mb-3">
                  <CompanyLogo name={company.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">{company.name}</p>
                    <p className="text-xs text-slate-500">{company.industry}</p>
                  </div>
                  {company.glassdoorRating && (
                    <div className="flex items-center gap-1 text-xs text-warning-600 font-semibold">
                      <Star className="w-3 h-3 fill-warning-400 text-warning-400" />
                      {company.glassdoorRating}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>{company.location}</span>
                  <span>{company.size} employees</span>
                </div>
                {company.techStack && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {company.techStack.slice(0, 4).map(t => (
                      <span key={t} className="text-2xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                    {company.techStack.length > 4 && (
                      <span className="text-2xs text-slate-400">+{company.techStack.length - 4}</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span>{appCountByCompany[company.id] ?? 0} application{appCountByCompany[company.id] !== 1 ? 's' : ''}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
