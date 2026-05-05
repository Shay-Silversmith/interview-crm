import { useState } from 'react'
import { FileText, Upload, CheckCircle2, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useMockStore } from '@/hooks/useMockStore'
import { documentsService } from '@/services/documentsService'
import { applicationsService } from '@/services/applicationsService'
import { formatDate, formatRelative } from '@/utils/date'
import { formatFileSize } from '@/utils/format'
import { cn } from '@/lib/cn'
import type { CVVersion } from '@/types'

const TABS = [
  { id: 'cv', label: 'CV Versions' },
  { id: 'docs', label: 'Other Documents' },
]

export function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('cv')
  const { data: cvVersions, loading: cvLoading } = useMockStore(() => documentsService.listCVVersions())
  const { data: documents, loading: docsLoading } = useMockStore(() => documentsService.listDocuments())
  const { data: apps } = useMockStore(() => applicationsService.list())

  const appMap: Record<string, string> = {}
  apps?.forEach(a => { appMap[a.id] = a.roleName + ' @ ' + a.companyName })

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Documents"
        description="CV versions and application files"
        actions={
          <Button variant="outline" size="sm" disabled>
            <Upload className="w-4 h-4" />
            Upload (Phase 5)
          </Button>
        }
      />

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-5" />

      {activeTab === 'cv' && (
        <div>
          {cvLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : !cvVersions?.length ? (
            <EmptyState icon={FileText} title="No CV versions" description="Upload your first CV to get started." />
          ) : (
            <div className="space-y-4">
              {cvVersions.map(cv => <CVCard key={cv.id} cv={cv} appMap={appMap} />)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'docs' && (
        <div>
          {docsLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : !documents?.length ? (
            <EmptyState icon={Layers} title="No documents" description="Upload cover letters, certificates, and more." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {documents.map(doc => (
                <Card key={doc.id} padding="sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{doc.fileName}</p>
                      {doc.fileSize && (
                        <p className="text-xs text-slate-400">{formatFileSize(doc.fileSize)}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-2xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{doc.type}</span>
                      </div>
                      {doc.applicationIds.length > 0 && (
                        <div className="mt-2">
                          <p className="text-2xs text-slate-400 mb-1">Used in:</p>
                          {doc.applicationIds.map(id => (
                            <Link key={id} to={`/applications/${id}`} className="block text-2xs text-primary-600 hover:underline truncate">
                              {appMap[id] ?? id}
                            </Link>
                          ))}
                        </div>
                      )}
                      {doc.notes && <p className="text-xs text-slate-400 mt-1 italic">{doc.notes}</p>}
                    </div>
                    <p className="text-2xs text-slate-300 shrink-0">{formatDate(doc.createdAt, 'MMM d')}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CVCard({ cv, appMap }: { cv: CVVersion; appMap: Record<string, string> }) {
  return (
    <Card className={cn('border', cv.isActive ? 'border-primary-200' : 'border-slate-200 opacity-80')}>
      <div className="flex items-start gap-4">
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold',
          cv.isActive ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400'
        )}>
          v{cv.version}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">{cv.name}</h3>
            {cv.isActive && (
              <span className="inline-flex items-center gap-1 text-2xs bg-success-100 text-success-700 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle2 className="w-2.5 h-2.5" /> Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{cv.fileName}</p>
          <p className="text-xs text-slate-600 mt-2 leading-snug">{cv.emphasis}</p>

          {/* Skills highlighted */}
          <div className="mt-3">
            <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Skills Highlighted</p>
            <div className="flex flex-wrap gap-1.5">
              {cv.skillsHighlighted.map(s => (
                <span key={s} className="text-2xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">{s}</span>
              ))}
            </div>
          </div>

          {/* Projects highlighted */}
          <div className="mt-3">
            <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Projects Featured</p>
            <ul className="space-y-1">
              {cv.projectsHighlighted.map(p => (
                <li key={p} className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Applications linked */}
          {cv.applicationIds.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Submitted to</p>
              <div className="flex flex-wrap gap-2">
                {cv.applicationIds.map(id => (
                  <Link
                    key={id}
                    to={`/applications/${id}`}
                    className="text-2xs bg-slate-100 text-primary-700 px-2.5 py-1 rounded-full hover:bg-primary-100 transition-colors font-medium"
                  >
                    {appMap[id] ?? id}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xs text-slate-300">{formatRelative(cv.updatedAt)}</p>
          {cv.fileSize && <p className="text-2xs text-slate-300 mt-0.5">{formatFileSize(cv.fileSize)}</p>}
        </div>
      </div>
      {cv.notes && (
        <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 italic">{cv.notes}</p>
      )}
    </Card>
  )
}
