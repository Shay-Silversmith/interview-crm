import { useState } from 'react'
import { FileText, CheckCircle2, Layers, Plus, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CVVersionForm } from '@/components/forms/CVVersionForm'
import { CVUploadDialog } from '@/components/documents/CVUploadDialog'
import { CVViewerButton } from '@/components/documents/CVViewerButton'
import { DocumentUploadDialog } from '@/components/documents/DocumentUploadDialog'
import { DocumentViewerButton } from '@/components/documents/DocumentViewerButton'
import { useMockStore } from '@/hooks/useMockStore'
import { useDocumentMutations } from '@/hooks/useDocumentMutations'
import { useI18n } from '@/hooks/useI18n'
import { documentsService } from '@/services/documentsService'
import { applicationsService } from '@/services/applicationsService'
import { formatDate, formatRelative } from '@/utils/date'
import { formatFileSize } from '@/utils/format'
import { cn } from '@/lib/cn'
import { QK } from '@/lib/query-keys'
import type { CVVersion, Document } from '@/types'
import type { CVVersionFormValues } from '@/lib/schemas/cvVersionSchema'

export function DocumentsPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('cv')

  const TABS = [
    { id: 'cv',   label: t('pages.documents.tabCv') },
    { id: 'docs', label: t('pages.documents.tabOther') },
  ]

  const { data: cvVersions, loading: cvLoading  } = useMockStore(() => documentsService.listCVVersions(), [], { key: QK.cvVersions.all() })
  const { data: documents,  loading: docsLoading } = useMockStore(() => documentsService.listDocuments(),   [], { key: QK.documents.all() })
  const { data: apps }                              = useMockStore(() => applicationsService.list(),         [], { key: QK.applications.all() })

  const { updateCV, deleteCV, deleteDoc } = useDocumentMutations()

  const appMap: Record<string, string> = {}
  apps?.forEach(a => { appMap[a.id] = a.roleName + ' @ ' + a.companyName })

  // Dialogs
  const [cvUploadOpen,  setCvUploadOpen]  = useState(false)
  const [editCV,        setEditCV]        = useState<CVVersion | null>(null)
  const [deleteCV_,     setDeleteCV]      = useState<CVVersion | null>(null)
  const [docUploadOpen, setDocUploadOpen] = useState(false)
  const [deleteDoc_,    setDeleteDoc]     = useState<Document | null>(null)

  // ── CV edit ─────────────────────────────────────────────────────────────────
  const handleEditCV = async (values: CVVersionFormValues) => {
    if (!editCV) return
    await updateCV.mutateAsync({
      id: editCV.id,
      data: {
        name:                values.name,
        version:             values.version,
        emphasis:            values.emphasis || undefined,
        skillsHighlighted:   values.skillsHighlighted ? values.skillsHighlighted.split(',').map(s => s.trim()).filter(Boolean) : [],
        projectsHighlighted: values.projectsHighlighted ? values.projectsHighlighted.split(',').map(s => s.trim()).filter(Boolean) : [],
        notes:               values.notes || undefined,
        isActive:            values.isActive,
      },
    })
    setEditCV(null)
  }

  // ── Storage-first deletes ───────────────────────────────────────────────────
  const handleDeleteCV = async () => {
    if (!deleteCV_) return
    await deleteCV.mutateAsync({ id: deleteCV_.id, storagePath: deleteCV_.storagePath })
    setDeleteCV(null)
  }

  const handleDeleteDoc = async () => {
    if (!deleteDoc_) return
    await deleteDoc.mutateAsync({ id: deleteDoc_.id, storagePath: deleteDoc_.storagePath })
    setDeleteDoc(null)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={t('pages.documents.title')}
        actions={
          activeTab === 'cv' ? (
            <Button onClick={() => setCvUploadOpen(true)}>
              <Plus className="w-4 h-4" />
              {t('pages.documents.uploadCv')}
            </Button>
          ) : (
            <Button onClick={() => setDocUploadOpen(true)}>
              <Plus className="w-4 h-4" />
              {t('pages.documents.uploadDoc')}
            </Button>
          )
        }
      />

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-5" />

      {/* ── CV Versions tab ─────────────────────────────────────────────────── */}
      {activeTab === 'cv' && (
        <div>
          {cvLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : !cvVersions?.length ? (
            <EmptyState
              icon={FileText}
              title={t('pages.documents.noCvVersions')}
              description={t('pages.documents.noCvVersionsSub')}
              action={{ label: t('pages.documents.uploadCv'), onClick: () => setCvUploadOpen(true) }}
            />
          ) : (
            <div className="space-y-4">
              {cvVersions.map(cv => (
                <CVCard
                  key={cv.id}
                  cv={cv}
                  appMap={appMap}
                  onEdit={() => setEditCV(cv)}
                  onDelete={() => setDeleteCV(cv)}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Other Documents tab ─────────────────────────────────────────────── */}
      {activeTab === 'docs' && (
        <div>
          {docsLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : !documents?.length ? (
            <EmptyState
              icon={Layers}
              title={t('pages.documents.noDocuments')}
              description={t('pages.documents.noDocumentsSub')}
              action={{ label: t('pages.documents.uploadDoc'), onClick: () => setDocUploadOpen(true) }}
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {documents.map(doc => (
                <Card key={doc.id} padding="sm" className="group">
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
                      {(doc.applicationIds ?? []).length > 0 && (
                        <div className="mt-2">
                          <p className="text-2xs text-slate-400 mb-1">Used in:</p>
                          {(doc.applicationIds ?? []).map(id => (
                            <Link key={id} to={`/applications/${id}`} className="block text-2xs text-primary-600 hover:underline truncate">
                              {appMap[id] ?? id}
                            </Link>
                          ))}
                        </div>
                      )}
                      {doc.notes && <p className="text-xs text-slate-400 mt-1 italic">{doc.notes}</p>}

                      {/* View button */}
                      {doc.storagePath && (
                        <div className="mt-2">
                          <DocumentViewerButton storagePath={doc.storagePath} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="text-2xs text-slate-300">{formatDate(doc.createdAt, 'MMM d')}</p>
                      <button
                        onClick={() => setDeleteDoc(doc)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-danger-50 text-slate-400 hover:text-danger-600 transition-all"
                        aria-label="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}

      {/* Upload new CV */}
      <CVUploadDialog open={cvUploadOpen} onClose={() => setCvUploadOpen(false)} />

      {/* Edit existing CV (metadata only — no file change) */}
      <Drawer open={!!editCV} onClose={() => setEditCV(null)} title={t('common.edit')}>
        {editCV && (
          <CVVersionForm
            initial={editCV}
            onSubmit={handleEditCV}
            onCancel={() => setEditCV(null)}
            loading={updateCV.isPending}
          />
        )}
      </Drawer>

      {/* Upload new document */}
      <DocumentUploadDialog open={docUploadOpen} onClose={() => setDocUploadOpen(false)} />

      {/* Delete CV confirm */}
      <ConfirmDialog
        open={!!deleteCV_}
        onClose={() => setDeleteCV(null)}
        onConfirm={handleDeleteCV}
        title={t('pages.documents.deleteConfirmTitle')}
        description={t('pages.documents.deleteConfirmSub')}
        confirmLabel={t('common.delete')}
        loading={deleteCV.isPending}
      />

      {/* Delete doc confirm */}
      <ConfirmDialog
        open={!!deleteDoc_}
        onClose={() => setDeleteDoc(null)}
        onConfirm={handleDeleteDoc}
        title={t('pages.documents.deleteConfirmTitle')}
        description={t('pages.documents.deleteConfirmSub')}
        confirmLabel={t('common.delete')}
        loading={deleteDoc.isPending}
      />
    </div>
  )
}

function CVCard({
  cv, appMap, onEdit, onDelete, t,
}: { cv: CVVersion; appMap: Record<string, string>; onEdit: () => void; onDelete: () => void; t: (key: string) => string }) {
  const [expanded, setExpanded] = useState(false)
  // Defensive defaults — older persisted data may be missing these arrays
  const skills:   string[] = cv.skillsHighlighted   ?? []
  const projects: string[] = cv.projectsHighlighted ?? []
  const apps:     string[] = cv.applicationIds      ?? []
  return (
    <Card className={cn('border group p-0 overflow-hidden', cv.isActive ? 'border-primary-200' : 'border-slate-200 opacity-90')}>
      {/* Compact header — always visible. Click anywhere to toggle expand. */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full text-start flex items-center gap-3 p-4 hover:bg-slate-50/60 transition-colors"
      >
        <div className={cn(
          'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-base font-bold',
          cv.isActive ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400',
        )}>
          v{cv.version}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-800">{cv.name}</h3>
            {cv.isActive && (
              <span className="inline-flex items-center gap-1 text-2xs bg-success-100 text-success-700 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle2 className="w-2.5 h-2.5" /> {t('pages.documents.activeBadge')}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 force-ltr truncate">{cv.fileName}</p>
          <p className="text-2xs text-slate-400">
            {cv.fileSize ? formatFileSize(cv.fileSize) + ' · ' : ''}
            {formatRelative(cv.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded content — skills, projects, links, actions */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">
          {cv.storagePath && (
            <div>
              <CVViewerButton storagePath={cv.storagePath} label="View file" variant="button" />
            </div>
          )}

          {cv.emphasis && (
            <p className="text-xs text-slate-600 leading-snug">{cv.emphasis}</p>
          )}

          {skills.length > 0 && (
            <div>
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t('pages.documents.skillsLabel')}</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map(s => (
                  <span key={s} className="text-2xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t('pages.documents.projectsLabel')}</p>
              <ul className="space-y-1">
                {projects.map(p => (
                  <li key={p} className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {apps.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Submitted to</p>
              <div className="flex flex-wrap gap-2">
                {apps.map(id => (
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

          {cv.notes && (
            <p className="pt-3 border-t border-slate-100 text-xs text-slate-400 italic">{cv.notes}</p>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit2 className="w-3.5 h-3.5" />
              {t('common.edit')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-danger-600 hover:bg-danger-50">
              <Trash2 className="w-3.5 h-3.5" />
              {t('common.delete')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
