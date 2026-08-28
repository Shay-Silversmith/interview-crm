// ---------------------------------------------------------------------------
// NewCompanyPage — /companies/new
// Full-page form for adding a new company.
// ---------------------------------------------------------------------------
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { CompanyForm } from '@/components/forms/CompanyForm'
import { useCompanyMutations } from '@/hooks/useCompanyMutations'
import type { CompanyFormValues } from '@/lib/schemas/companySchema'

export function NewCompanyPage() {
  const navigate = useNavigate()
  const { create } = useCompanyMutations()

  const handleSubmit = async (values: CompanyFormValues) => {
    await create.mutateAsync({
      name:            values.name,
      industry:        values.industry   || undefined,
      size:            values.size,
      location:        values.location   || undefined,
      website:         values.website    || undefined,
      linkedinUrl:     values.linkedinUrl || undefined,
      logoUrl:         values.logoUrl    || undefined,
      description:     values.description || undefined,
      notes:           values.notes      || undefined,
      glassdoorRating: values.glassdoorRating,
      techStack: values.techStack
        ? values.techStack.split(',').map(s => s.trim()).filter(Boolean)
        : [],
    })
    navigate('/companies')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/companies"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Companies
      </Link>

      <PageHeader
        title="New Company"
        description="Research and track a company you're targeting"
      />

      <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-card p-6">
        <CompanyForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/companies')}
          loading={create.isPending}
        />
      </div>
    </div>
  )
}
