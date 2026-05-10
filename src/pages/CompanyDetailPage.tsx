import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Star, Sparkles, Building2, Edit2, Trash2 } from 'lucide-react'
import { CompanyLogo, Avatar } from '@/components/ui/Avatar'
import { StageBadge, ContactTypeBadge } from '@/components/ui/Badge'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CompanyForm } from '@/components/forms/CompanyForm'
import { useMockStore } from '@/hooks/useMockStore'
import { useCompanyMutations } from '@/hooks/useCompanyMutations'
import { useI18n } from '@/hooks/useI18n'
import { companiesService } from '@/services/companiesService'
import { applicationsService } from '@/services/applicationsService'
import { contactsService } from '@/services/contactsService'
import { aiService } from '@/services/aiService'
import { QK } from '@/lib/query-keys'
import type { CompanyFormValues } from '@/lib/schemas/companySchema'

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { data: company, loading } = useMockStore(() => companiesService.getById(id!), [id], { key: QK.companies.detail(id!) })
  const { data: apps } = useMockStore(() => applicationsService.getByCompany(id!), [id])
  const { data: contacts } = useMockStore(() => contactsService.getByCompany(id!), [id])
  const { data: aiSummaries } = useMockStore(() => aiService.list())
  const companySummary = aiSummaries?.find(s => s.companyId === id && s.toolType === 'Company Summary')
  const { update, remove } = useCompanyMutations()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleEdit = async (values: CompanyFormValues) => {
    await update.mutateAsync({
      id: id!,
      data: {
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
      },
    })
    setEditOpen(false)
  }

  const handleDelete = async () => {
    await remove.mutateAsync(id!)
    navigate('/companies')
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    )
  }

  if (!company) {
    return <EmptyState icon={Building2} title={t('pages.companies.companyNotFound')} description="" />
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to="/companies" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          {t('pages.companies.title')}
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit2 className="w-3.5 h-3.5" />
            {t('common.edit')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)} className="text-danger-600 hover:bg-danger-50">
            <Trash2 className="w-3.5 h-3.5" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      {/* Hero */}
      <Card className="mb-4">
        <div className="flex items-start gap-4">
          <CompanyLogo name={company.name} size="lg" logoUrl={company.logoUrl} />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
              {company.glassdoorRating && (
                <div className="flex items-center gap-1 text-sm text-warning-600 font-semibold">
                  <Star className="w-4 h-4 fill-warning-400 text-warning-400" />
                  {company.glassdoorRating}
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{company.industry} · {company.location} · {company.size} employees</p>
            {company.description && (
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{company.description}</p>
            )}
            <div className="flex gap-3 mt-3">
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                  <ExternalLink className="w-3 h-3" /> Website
                </a>
              )}
              {company.linkedinUrl && (
                <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                  <ExternalLink className="w-3 h-3" /> LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
        {company.techStack && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2">Tech Stack</p>
            <div className="flex flex-wrap gap-1.5">
              {company.techStack.map(t => (
                <span key={t} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">{t}</span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* AI Summary */}
          {companySummary && (
            <Card className="border-violet-200 bg-violet-50/30">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <h3 className="text-sm font-semibold text-violet-800">{t('pages.companies.aiSummary')}</h3>
                <span className="ml-auto text-2xs text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded font-medium">Mocked</span>
              </div>
              <dl className="space-y-3">
                {Object.entries(companySummary.outputData).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-2xs font-semibold text-violet-700 uppercase tracking-wide capitalize mb-0.5">
                      {k.replace(/([A-Z])/g, ' $1').trim()}
                    </dt>
                    <dd className="text-xs text-slate-600 leading-relaxed">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {/* Applications */}
          {apps && apps.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('pages.companies.relatedApplications')}</h3>
              <ul className="space-y-2">
                {apps.map(app => (
                  <li key={app.id}>
                    <Link to={`/applications/${app.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">{app.roleName}</p>
                        <p className="text-xs text-slate-400">{app.appliedAt ? `Applied ${new Date(app.appliedAt).toLocaleDateString()}` : 'Not applied yet'}</p>
                      </div>
                      <StageBadge stage={app.stage} />
                      {app.fitScore !== undefined && <ScoreRing score={app.fitScore} size="sm" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {/* Notes */}
          {company.notes && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Notes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{company.notes}</p>
            </Card>
          )}

          {/* Contacts */}
          {contacts && contacts.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('pages.companies.relatedContacts')}</h3>
              <ul className="space-y-3">
                {contacts.map(c => (
                  <li key={c.id} className="flex items-center gap-2">
                    <Avatar name={c.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{c.name}</p>
                      <p className="text-2xs text-slate-400">{c.title}</p>
                    </div>
                    <ContactTypeBadge type={c.type} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {/* Edit drawer */}
      <Drawer open={editOpen} onClose={() => setEditOpen(false)} title={t('common.edit')}>
        <CompanyForm
          initial={company}
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
          loading={update.isPending}
          submitLabel={t('common.save')}
        />
      </Drawer>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('common.delete') + '?'}
        description={`Remove "${company.name}" and all its data? This cannot be undone.`}
        confirmLabel={t('common.delete')}
        loading={remove.isPending}
      />
    </div>
  )
}
