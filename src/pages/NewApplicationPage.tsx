// ---------------------------------------------------------------------------
// NewApplicationPage — /applications/new
// Full-page form for adding a new job application.
// ---------------------------------------------------------------------------
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ApplicationForm } from '@/components/forms/ApplicationForm'
import { useMockStore } from '@/hooks/useMockStore'
import { useApplicationMutations } from '@/hooks/useApplicationMutations'
import { companiesService } from '@/services/companiesService'
import type { ApplicationFormValues } from '@/lib/schemas/applicationSchema'
import { QK } from '@/lib/query-keys'
import { Link } from 'react-router-dom'

export function NewApplicationPage() {
  const navigate = useNavigate()
  const { data: companies } = useMockStore(
    () => companiesService.list(),
    [],
    { key: QK.companies.all() }
  )
  const { create } = useApplicationMutations()

  const handleSubmit = async (values: ApplicationFormValues) => {
    // Resolve company name from selected id
    const company = companies?.find(c => c.id === values.companyId)
    await create.mutateAsync({
      ...values,
      companyName: company?.name ?? values.companyName,
      workModel:   values.workModel || undefined,
      roleUrl:     values.roleUrl   || undefined,
      appliedAt:   values.appliedAt  ? new Date(values.appliedAt).toISOString()  : undefined,
      deadlineAt:  values.deadlineAt ? new Date(values.deadlineAt).toISOString() : undefined,
    })
    navigate('/applications')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/applications"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Applications
      </Link>

      <PageHeader
        title="New Application"
        description="Track a new job you're pursuing"
      />

      {companies !== null && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6">
          <ApplicationForm
            companies={companies ?? []}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/applications')}
            loading={create.isPending}
          />
        </div>
      )}
    </div>
  )
}
