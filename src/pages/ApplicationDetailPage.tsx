import { useState, useEffect } from 'react'
import type { JobApplication } from '@/types'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ExternalLink, Calendar, User, CheckSquare,
  FileText, Sparkles, MessageSquare, MapPin, Briefcase,
  Plus, Edit2, Trash2, Check,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { StageBadge, PriorityBadge, StatusBadge, ContactTypeBadge } from '@/components/ui/Badge'
import { EditableEnumChip } from '@/components/ui/EditableEnumChip'
import { EditApplicationDrawer } from '@/components/applications/EditApplicationDrawer'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { CompanyLogo, Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { InterviewStageForm } from '@/components/forms/InterviewStageForm'
import { TaskForm } from '@/components/forms/TaskForm'
import { useMockStore } from '@/hooks/useMockStore'
import { useInterviewStageMutations } from '@/hooks/useInterviewStageMutations'
import { useTaskMutations } from '@/hooks/useTaskMutations'
import { useApplicationMutations } from '@/hooks/useApplicationMutations'
import { useContactMutations } from '@/hooks/useContactMutations'
import { ContactForm } from '@/components/forms/ContactForm'
import type { ContactFormValues } from '@/lib/schemas/contactSchema'
import { useI18n } from '@/hooks/useI18n'
import { applicationsService } from '@/services/applicationsService'
import { tasksService } from '@/services/tasksService'
import { contactsService } from '@/services/contactsService'
import { documentsService } from '@/services/documentsService'
import { aiService } from '@/services/aiService'
import { CVViewerButton } from '@/components/documents/CVViewerButton'
import { DocumentViewerButton } from '@/components/documents/DocumentViewerButton'
import { DocumentUploadDialog } from '@/components/documents/DocumentUploadDialog'
import { CVUploadDialog } from '@/components/documents/CVUploadDialog'
import { formatDate, formatDateTime, formatRelative, isOverdue } from '@/utils/date'
import { formatFileSize } from '@/utils/format'
import { trackRecent } from '@/lib/recents'
import { cn } from '@/lib/cn'
import { QK } from '@/lib/query-keys'
import type { InterviewStage, Task, Contact, CVVersion, Document } from '@/types'
import type { InterviewStageFormValues } from '@/lib/schemas/interviewStageSchema'
import type { TaskFormValues } from '@/lib/schemas/taskSchema'

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'overview')

  const DETAIL_TABS = [
    { id: 'overview',   label: t('pages.applicationDetail.tabs.overview') },
    { id: 'jd',         label: t('pages.applicationDetail.tabs.jd') },
    { id: 'interviews', label: t('pages.applicationDetail.tabs.interviews') },
    { id: 'tasks',      label: t('pages.applicationDetail.tabs.tasks') },
    { id: 'contacts',   label: t('pages.applicationDetail.tabs.contacts') },
    { id: 'files',      label: t('pages.applicationDetail.tabs.files') },
    { id: 'notes',      label: t('pages.applicationDetail.tabs.notes') },
    { id: 'ai',         label: t('pages.applicationDetail.tabs.ai') },
  ]

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t) setActiveTab(t)
  }, [searchParams])

  const { data: app, loading } = useMockStore(
    () => applicationsService.getById(id!),
    [id],
    { key: QK.applications.detail(id!) }
  )
  const { data: tasks } = useMockStore(() => tasksService.getByApplication(id!), [id], { key: QK.tasks.byApp(id!) })
  const { data: contacts } = useMockStore(() => contactsService.getByApplication(id!), [id])
  const { data: cvVersions } = useMockStore(() => documentsService.listCVVersions(), [], { key: QK.cvVersions.all() })
  const { data: aiSummaries } = useMockStore(() => aiService.getByApplication(id!), [id])
  const { data: appDocuments } = useMockStore(() => documentsService.getDocumentsByApplication(id!), [id], { key: QK.documents.all() })

  const submittedCV = cvVersions?.find(cv => cv.id === app?.submittedCvId)

  // Track recent for command palette
  useEffect(() => {
    if (app) {
      trackRecent({
        id:    app.id,
        type:  'application',
        label: app.roleName,
        sub:   app.companyName,
        to:    `/applications/${app.id}`,
      })
    }
  }, [app?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Next-action task (most urgent non-done task with a due date)
  const nextTask = tasks
    ?.filter(t => t.status !== 'Done' && t.status !== 'Cancelled' && t.dueAt)
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())[0]

  // Interview stage mutations
  const { create: createStage, update: updateStage, remove: removeStage } = useInterviewStageMutations(id!)
  const [stageFormOpen, setStageFormOpen] = useState(false)
  const [editStage, setEditStage] = useState<InterviewStage | null>(null)
  const [deleteStage, setDeleteStage] = useState<InterviewStage | null>(null)

  // Task mutations
  const { create: createTask, update: updateTask, complete: completeTask, remove: removeTask } = useTaskMutations()
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteTask, setDeleteTask] = useState<Task | null>(null)

  // Application mutations (inline chips + edit drawer)
  const { updateStage: updateAppStage, updatePriority, update: updateApp, remove: removeApp } = useApplicationMutations()
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [deleteAppOpen, setDeleteAppOpen] = useState(false)

  // Contact mutations (inline CRUD inside the Contacts tab)
  const { create: createContact, update: updateContact, remove: removeContact } = useContactMutations()
  const [contactFormOpen, setContactFormOpen] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [deleteContactDlg, setDeleteContactDlg] = useState<Contact | null>(null)

  const handleCreateContact = async (values: ContactFormValues) => {
    await createContact.mutateAsync({
      name:           values.name,
      type:           values.type,
      company:        values.company || app?.companyName,
      companyId:      app?.companyId,
      title:          values.title || undefined,
      email:          values.email || undefined,
      phone:          values.phone || undefined,
      linkedinUrl:    values.linkedinUrl || undefined,
      notes:          values.notes || undefined,
      followUpDueAt:  values.followUpDueAt ? new Date(values.followUpDueAt).toISOString() : undefined,
      applicationIds: id ? [id] : [],
    })
    setContactFormOpen(false)
  }

  const handleUpdateContact = async (values: ContactFormValues) => {
    if (!editContact) return
    await updateContact.mutateAsync({
      id: editContact.id,
      data: {
        name:          values.name,
        type:          values.type,
        company:       values.company || undefined,
        title:         values.title || undefined,
        email:         values.email || undefined,
        phone:         values.phone || undefined,
        linkedinUrl:   values.linkedinUrl || undefined,
        notes:         values.notes || undefined,
        followUpDueAt: values.followUpDueAt ? new Date(values.followUpDueAt).toISOString() : undefined,
      },
    })
    setEditContact(null)
  }

  const handleCreateStage = async (values: InterviewStageFormValues) => {
    await createStage.mutateAsync({
      type:             values.type,
      outcome:          values.outcome || undefined,
      scheduledAt:      values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
      completedAt:      values.completedAt ? new Date(values.completedAt).toISOString() : undefined,
      duration:         values.duration,
      interviewer:      values.interviewer || undefined,
      interviewerTitle: values.interviewerTitle || undefined,
      notes:            values.notes || undefined,
      feedbackReceived: values.feedbackReceived || undefined,
      nextSteps:        values.nextSteps || undefined,
    })
    setStageFormOpen(false)
  }

  const handleEditStage = async (values: InterviewStageFormValues) => {
    if (!editStage) return
    await updateStage.mutateAsync({
      id: editStage.id,
      data: {
        type:             values.type,
        outcome:          values.outcome || undefined,
        scheduledAt:      values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
        completedAt:      values.completedAt ? new Date(values.completedAt).toISOString() : undefined,
        duration:         values.duration,
        interviewer:      values.interviewer || undefined,
        interviewerTitle: values.interviewerTitle || undefined,
        notes:            values.notes || undefined,
        feedbackReceived: values.feedbackReceived || undefined,
        nextSteps:        values.nextSteps || undefined,
      },
    })
    setEditStage(null)
  }

  const handleCreateTask = async (values: TaskFormValues) => {
    await createTask.mutateAsync({
      title:         values.title,
      category:      values.category,
      priority:      values.priority,
      status:        values.status,
      description:   values.description || undefined,
      dueAt:         values.dueAt ? new Date(values.dueAt).toISOString() : undefined,
      applicationId: id,
      companyName:   app?.companyName,
    })
    setTaskFormOpen(false)
  }

  const handleEditTask = async (values: TaskFormValues) => {
    if (!editTask) return
    await updateTask.mutateAsync({
      id: editTask.id,
      data: {
        title:       values.title,
        category:    values.category,
        priority:    values.priority,
        status:      values.status,
        description: values.description || undefined,
        dueAt:       values.dueAt ? new Date(values.dueAt).toISOString() : undefined,
      },
    })
    setEditTask(null)
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (!app) {
    return (
      <EmptyState
        icon={Briefcase}
        title={t('pages.applicationDetail.notFound')}
        description={t('pages.applicationDetail.notFoundSub')}
        action={{ label: t('pages.applicationDetail.backToApps'), onClick: () => window.history.back() }}
      />
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back link + delete */}
      <div className="flex items-center justify-between mb-4">
        <Link to="/applications" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          {t('pages.applicationDetail.backToApplications')}
        </Link>
        <Button variant="ghost" size="sm" onClick={() => setDeleteAppOpen(true)} className="text-danger-600 hover:bg-danger-50">
          <Trash2 className="w-3.5 h-3.5" />
          {t('common.delete')}
        </Button>
      </div>

      {/* Hero — dot grid adds subtle texture without changing the layout */}
      <div className="dot-grid-bg bg-surface rounded-2xl border border-slate-200/80 shadow-card p-6 mb-4">
        <div className="flex items-start gap-4">
          <CompanyLogo name={app.companyName} size="lg" logoUrl={app.companyLogoUrl} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{app.roleName}</h1>
                <Link to={`/companies/${app.companyId}`} className="text-sm text-slate-500 hover:text-primary-600 transition-colors">
                  {app.companyName}
                </Link>
                {app.location && (
                  <span className="text-sm text-slate-400"> · <MapPin className="inline w-3 h-3" /> {app.location}</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {app.roleUrl && (
                  <a
                    href={app.roleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t('pages.applicationDetail.viewJd')}
                  </a>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDrawerOpen(true)}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {t('pages.applicationDetail.editDetails')}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {/* Stage — inline editable chip */}
              <EditableEnumChip
                value={app.stage}
                options={[
                  { value: 'Interested',          label: t('badges.stage.interested') },
                  { value: 'Applied',             label: t('badges.stage.applied') },
                  { value: 'HR Screen',           label: t('badges.stage.hrScreen') },
                  { value: 'Home Assignment',     label: t('badges.stage.homeAssignment') },
                  { value: 'Technical Interview', label: t('badges.stage.technicalInterview') },
                  { value: 'Manager Interview',   label: t('badges.stage.managerInterview') },
                  { value: 'Final Interview',     label: t('badges.stage.finalInterview') },
                  { value: 'Offer',               label: t('badges.stage.offer') },
                  { value: 'Negotiating',         label: t('badges.stage.negotiating') },
                  { value: 'Accepted',            label: t('badges.stage.accepted') },
                  { value: 'Rejected',            label: t('badges.stage.rejected') },
                  { value: 'Withdrawn',           label: t('badges.stage.withdrawn') },
                ]}
                onCommit={stage => void updateAppStage.mutateAsync({ id: app.id, stage })}
                renderBadge={stage => <StageBadge stage={stage} />}
                disabled={updateAppStage.isPending}
              />

              {/* Priority — inline editable chip */}
              <EditableEnumChip
                value={app.priority}
                options={[
                  { value: 'Critical', label: t('forms.options.priorityCritical') },
                  { value: 'High',     label: t('forms.options.priorityHigh') },
                  { value: 'Medium',   label: t('forms.options.priorityMedium') },
                  { value: 'Low',      label: t('forms.options.priorityLow') },
                ]}
                onCommit={priority => void updatePriority.mutateAsync({ id: app.id, priority })}
                renderBadge={priority => <PriorityBadge priority={priority} />}
                disabled={updatePriority.isPending}
              />

              {app.workModel && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{app.workModel}</span>
              )}
              {app.appliedAt && (
                <span className="text-xs text-slate-400">Applied {formatDate(app.appliedAt)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {app.fitScore !== undefined && <ScoreRing score={app.fitScore} label="Fit" size="lg" />}
            {app.urgencyScore !== undefined && <ScoreRing score={app.urgencyScore} label="Urgency" size="lg" />}
          </div>
        </div>

        {app.submittedCvName && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">{t('pages.applicationDetail.submittedCvLabel')}</span>
            {submittedCV?.storagePath ? (
              <CVViewerButton
                storagePath={submittedCV.storagePath}
                label={app.submittedCvName}
                variant="chip"
              />
            ) : (
              <Link to="/documents" className="text-xs text-primary-600 font-medium hover:underline">
                {app.submittedCvName}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Next Action bar */}
      {nextTask && (
        <Link
          to="/tasks"
          className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors group"
        >
          <CheckSquare className={cn('w-4 h-4 shrink-0', isOverdue(nextTask.dueAt!) ? 'text-danger-500' : 'text-slate-400')} />
          <span className="text-sm text-slate-700 min-w-0 truncate">
            <span className="font-medium">Next:</span> {nextTask.title}
          </span>
          <span className={cn('text-xs shrink-0', isOverdue(nextTask.dueAt!) ? 'text-danger-500 font-medium' : 'text-slate-400')}>
            — {isOverdue(nextTask.dueAt!) ? 'overdue ' : ''}{formatRelative(nextTask.dueAt!)}
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 ms-auto" />
        </Link>
      )}

      {/* Tabs */}
      <Tabs tabs={DETAIL_TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      {/* Tab content — key forces a clean fade when the active tab changes */}
      <div key={activeTab} className="animate-fade-in">
        {activeTab === 'overview' && <OverviewTab app={app} tasks={tasks} contacts={contacts} t={t} />}
        {activeTab === 'jd' && <JDTab app={app} t={t} />}
        {activeTab === 'interviews' && (
          <InterviewsTab
            stages={app.interviewStages}
            onAdd={() => setStageFormOpen(true)}
            onEdit={setEditStage}
            onDelete={setDeleteStage}
            t={t}
          />
        )}
        {activeTab === 'tasks' && (
          <TasksTab
            tasks={tasks}
            onAdd={() => setTaskFormOpen(true)}
            onComplete={taskId => void completeTask.mutateAsync(taskId)}
            onEdit={setEditTask}
            onDelete={setDeleteTask}
            t={t}
          />
        )}
        {activeTab === 'contacts' && (
          <ContactsTab
            contacts={contacts}
            onAdd={() => setContactFormOpen(true)}
            onEdit={setEditContact}
            onDelete={setDeleteContactDlg}
            t={t}
          />
        )}
        {activeTab === 'files' && (
          <FilesTab
            cv={submittedCV}
            applicationId={id!}
            appDocuments={appDocuments ?? []}
            t={t}
          />
        )}
        {activeTab === 'notes' && <NotesTab notes={app.notes} t={t} />}
        {activeTab === 'ai' && <AITab app={app} summaries={aiSummaries} t={t} />}
      </div>

      {/* Interview stage: add modal */}
      <Modal open={stageFormOpen} onClose={() => setStageFormOpen(false)} title={t('pages.applicationDetail.addStage')}>
        <InterviewStageForm
          onSubmit={handleCreateStage}
          onCancel={() => setStageFormOpen(false)}
          loading={createStage.isPending}
        />
      </Modal>

      {/* Interview stage: edit modal */}
      <Modal open={!!editStage} onClose={() => setEditStage(null)} title={t('common.edit')}>
        {editStage && (
          <InterviewStageForm
            initial={editStage}
            onSubmit={handleEditStage}
            onCancel={() => setEditStage(null)}
            loading={updateStage.isPending}
          />
        )}
      </Modal>

      {/* Interview stage: delete */}
      <ConfirmDialog
        open={!!deleteStage}
        onClose={() => setDeleteStage(null)}
        onConfirm={async () => {
          if (!deleteStage) return
          await removeStage.mutateAsync(deleteStage.id)
          setDeleteStage(null)
        }}
        title={t('common.delete') + '?'}
        description={`Remove this "${deleteStage?.type}" stage? This cannot be undone.`}
        confirmLabel={t('common.delete')}
        loading={removeStage.isPending}
      />

      {/* Task: add modal */}
      <Modal open={taskFormOpen} onClose={() => setTaskFormOpen(false)} title={t('pages.applicationDetail.addTask')}>
        <TaskForm
          initial={{ applicationId: id, companyName: app.companyName }}
          onSubmit={handleCreateTask}
          onCancel={() => setTaskFormOpen(false)}
          loading={createTask.isPending}
        />
      </Modal>

      {/* Task: edit modal */}
      <Modal open={!!editTask} onClose={() => setEditTask(null)} title={t('common.edit')}>
        {editTask && (
          <TaskForm
            initial={editTask}
            onSubmit={handleEditTask}
            onCancel={() => setEditTask(null)}
            loading={updateTask.isPending}
          />
        )}
      </Modal>

      {/* Task: delete */}
      <ConfirmDialog
        open={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={async () => {
          if (!deleteTask) return
          await removeTask.mutateAsync(deleteTask.id)
          setDeleteTask(null)
        }}
        title={t('common.delete') + '?'}
        description={`Remove "${deleteTask?.title}"? This cannot be undone.`}
        confirmLabel={t('common.delete')}
        loading={removeTask.isPending}
      />

      {/* Application: delete */}
      <ConfirmDialog
        open={deleteAppOpen}
        onClose={() => setDeleteAppOpen(false)}
        onConfirm={async () => {
          await removeApp.mutateAsync(id!)
          navigate('/applications')
        }}
        title={t('pages.applications.deleteTitle')}
        description={`Remove "${app.roleName} @ ${app.companyName}" from your pipeline? This cannot be undone.`}
        confirmLabel={t('common.delete')}
        loading={removeApp.isPending}
      />

      {/* Application: edit details drawer */}
      <EditApplicationDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        app={app}
        cvVersions={cvVersions ?? []}
      />

      {/* Contact: add modal */}
      <Modal open={contactFormOpen} onClose={() => setContactFormOpen(false)} title={t('forms.actions.addContact')}>
        <ContactForm
          initial={{ company: app.companyName, companyId: app.companyId }}
          onSubmit={handleCreateContact}
          onCancel={() => setContactFormOpen(false)}
          loading={createContact.isPending}
        />
      </Modal>

      {/* Contact: edit modal */}
      <Modal open={!!editContact} onClose={() => setEditContact(null)} title={t('common.edit')}>
        {editContact && (
          <ContactForm
            initial={editContact}
            onSubmit={handleUpdateContact}
            onCancel={() => setEditContact(null)}
            loading={updateContact.isPending}
          />
        )}
      </Modal>

      {/* Contact: delete confirm */}
      <ConfirmDialog
        open={!!deleteContactDlg}
        onClose={() => setDeleteContactDlg(null)}
        onConfirm={async () => {
          if (!deleteContactDlg) return
          await removeContact.mutateAsync(deleteContactDlg.id)
          setDeleteContactDlg(null)
        }}
        title={t('common.delete') + '?'}
        description={`Remove "${deleteContactDlg?.name}"? This will not delete them from any other application.`}
        confirmLabel={t('common.delete')}
        loading={removeContact.isPending}
      />
    </div>
  )
}

function OverviewTab({ app, tasks, contacts, t }: { app: JobApplication; tasks: Task[] | null; contacts: Contact[] | null; t: (key: string) => string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {app.whyInteresting && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">{t('pages.applicationDetail.whyInteresting')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{app.whyInteresting}</p>
          </Card>
        )}
        {app.whatToEmphasize && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">{t('pages.applicationDetail.whatToEmphasize')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{app.whatToEmphasize}</p>
          </Card>
        )}
        {app.nextEventDescription && (
          <Card className="border-primary-200 bg-primary-50/40">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-primary-500" />
              <span className="text-xs font-semibold text-primary-700 uppercase tracking-wide">{t('pages.applicationDetail.nextEvent')}</span>
            </div>
            <p className="text-sm font-medium text-slate-800">{app.nextEventDescription}</p>
            {app.nextEventAt && (
              <p className="text-xs text-slate-500 mt-1 force-ltr">{formatDateTime(app.nextEventAt)}</p>
            )}
          </Card>
        )}
      </div>
      <div className="space-y-4">
        {tasks && tasks.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('pages.applicationDetail.openTasks')}</h3>
            <ul className="space-y-2">
              {tasks.filter(t => t.status !== 'Done').slice(0, 3).map(task => (
                <li key={task.id} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 leading-snug">{task.title}</p>
                    {task.dueAt && (
                      <p className="text-2xs text-slate-400 mt-0.5">{formatDate(task.dueAt)}</p>
                    )}
                  </div>
                  <PriorityBadge priority={task.priority} />
                </li>
              ))}
            </ul>
          </Card>
        )}
        {contacts && contacts.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('pages.applicationDetail.keyContacts')}</h3>
            <ul className="space-y-3">
              {contacts.map(contact => (
                <li key={contact.id} className="flex items-center gap-2">
                  <Avatar name={contact.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{contact.name}</p>
                    <p className="text-2xs text-slate-400">{contact.title}</p>
                  </div>
                  <ContactTypeBadge type={contact.type} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}

function JDTab({ app, t }: { app: JobApplication; t: (key: string) => string }) {
  const aiSummary = app.aiRoleSummary as Record<string, unknown> | undefined

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">{t('pages.applicationDetail.fullJobDescription')}</h3>
          {app.jobDescription ? (
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap force-ltr">
              {app.jobDescription}
            </div>
          ) : (
            <EmptyState icon={FileText} title={t('pages.applicationDetail.noJdSaved')} description={t('pages.applicationDetail.noJdSavedSub')} className="py-8" />
          )}
        </Card>
      </div>
      <div>
        {aiSummary ? (
          <Card className="border-violet-200 bg-violet-50/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-semibold text-violet-800">{t('pages.applicationDetail.aiAnalysis')}</h3>
              <span className="ms-auto text-2xs text-success-600 bg-success-50 border border-success-200 px-1.5 py-0.5 rounded-full font-bold">{t('pages.applicationDetail.savedBadge')}</span>
            </div>
            <dl className="space-y-3">
              {Object.entries(aiSummary).slice(0, 5).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-2xs font-bold text-violet-600 uppercase tracking-widest mb-0.5">
                    {k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}
                  </dt>
                  <dd className="text-xs text-slate-600 leading-relaxed">
                    {Array.isArray(v)
                      ? (v as string[]).slice(0, 3).join(', ')
                      : String(v)}
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              to={`/ai?tool=jd-parser&appId=${app.id}`}
              className="mt-3 inline-flex items-center gap-1 text-2xs font-medium text-violet-600 hover:text-violet-800"
            >
              <Sparkles className="w-3 h-3" />
              {t('pages.applicationDetail.reparseJd')}
            </Link>
          </Card>
        ) : (
          <Card className="border-violet-200/60 bg-violet-50/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-slate-700">{t('pages.applicationDetail.aiAnalysis')}</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              {t('pages.applicationDetail.noAiAnalysis')}
            </p>
            <Link to={`/ai?tool=jd-parser&appId=${app.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                <Sparkles className="w-3.5 h-3.5" />
                {t('pages.applicationDetail.parseThisJd')}
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}

const OUTCOME_STYLES: Record<string, { dot: string; label: string; cardBorder: string }> = {
  Passed:    { dot: 'bg-success-500 ring-success-200',   label: 'text-success-700 bg-success-100',  cardBorder: 'border-success-200' },
  Failed:    { dot: 'bg-danger-500 ring-danger-200',     label: 'text-danger-700 bg-danger-100',    cardBorder: 'border-danger-200' },
  Pending:   { dot: 'bg-warning-400 ring-warning-200',   label: 'text-warning-700 bg-warning-100',  cardBorder: '' },
  Cancelled: { dot: 'bg-slate-300 ring-slate-100',       label: 'text-slate-500 bg-slate-100',      cardBorder: 'border-slate-100' },
}

function InterviewsTab({
  stages, onAdd, onEdit, onDelete, t,
}: {
  stages: InterviewStage[]
  onAdd: () => void
  onEdit: (s: InterviewStage) => void
  onDelete: (s: InterviewStage) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {stages.length === 1
            ? t('pages.applicationDetail.stagesCount', { count: stages.length })
            : t('pages.applicationDetail.stagesCountPlural', { count: stages.length })}
        </p>
        <Button size="sm" onClick={onAdd}>
          <Plus className="w-3.5 h-3.5" />
          {t('pages.applicationDetail.addStage')}
        </Button>
      </div>

      {stages.length === 0 ? (
        <EmptyState icon={Calendar} title={t('pages.applicationDetail.noInterviewStages')} description={t('pages.applicationDetail.noInterviewStagesSub')} action={{ label: t('pages.applicationDetail.addStage'), onClick: onAdd }} className="py-16" />
      ) : (
        stages.map((stage, i) => {
          const outcome = stage.outcome ?? 'Pending'
          const style = OUTCOME_STYLES[outcome] ?? OUTCOME_STYLES.Pending
          const isLast = i === stages.length - 1
          const isExpanded = expandedId === stage.id

          return (
            <div key={stage.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={cn('w-3 h-3 rounded-full ring-4 mt-5 shrink-0 z-10', style.dot)} />
                {!isLast && <div className="w-px flex-1 bg-slate-200 my-1" />}
              </div>

              <div className={cn('flex-1 mb-3 bg-surface rounded-2xl border shadow-card overflow-hidden group', style.cardBorder || 'border-slate-200/80')}>
                <div className="flex items-start">
                  <button
                    className="flex-1 flex items-start gap-3 p-4 text-left hover:bg-slate-50/60 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : stage.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">{stage.type}</p>
                        {stage.outcome && (
                          <span className={cn('text-2xs font-bold px-2 py-0.5 rounded-full', style.label)}>
                            {stage.outcome}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 force-ltr">
                        {stage.scheduledAt ? formatDateTime(stage.scheduledAt) : t('pages.applicationDetail.notScheduled')}
                        {stage.interviewer && ` · ${stage.interviewer}`}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 mt-0.5">
                      {isExpanded ? t('pages.applicationDetail.collapse') : t('pages.applicationDetail.expand')}
                    </span>
                  </button>
                  <div className="flex items-center gap-1 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(stage)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                      aria-label="Edit stage"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(stage)}
                      className="p-1 rounded hover:bg-danger-50 text-slate-400 hover:text-danger-600"
                      aria-label="Delete stage"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                    {stage.notes && (
                      <div>
                        <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('pages.applicationDetail.stageNotes')}</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{stage.notes}</p>
                      </div>
                    )}
                    {stage.feedbackReceived && (
                      <div>
                        <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('pages.applicationDetail.feedbackReceived')}</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{stage.feedbackReceived}</p>
                      </div>
                    )}
                    {stage.nextSteps && (
                      <div>
                        <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('pages.applicationDetail.nextSteps')}</p>
                        <p className="text-sm text-slate-600">{stage.nextSteps}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function TasksTab({
  tasks, onAdd, onComplete, onEdit, onDelete, t,
}: {
  tasks: Task[] | null
  onAdd: () => void
  onComplete: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}) {
  const count = tasks?.length ?? 0
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {count === 1
            ? t('pages.applicationDetail.tasksCount', { count })
            : t('pages.applicationDetail.tasksCountPlural', { count })}
        </p>
        <Button size="sm" onClick={onAdd}>
          <Plus className="w-3.5 h-3.5" />
          {t('pages.applicationDetail.addTask')}
        </Button>
      </div>

      {!tasks?.length ? (
        <EmptyState icon={CheckSquare} title={t('pages.applicationDetail.noTasks')} description={t('pages.applicationDetail.noTasksSub')} action={{ label: t('pages.applicationDetail.addTask'), onClick: onAdd }} className="py-16" />
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <Card key={task.id} padding="sm" className="group">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => task.status !== 'Done' && onComplete(task.id)}
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                    task.status === 'Done' ? 'bg-success-500 border-success-500' : 'border-slate-300 hover:border-primary-400'
                  )}
                  aria-label={`Mark ${task.title} as done`}
                >
                  {task.status === 'Done' && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', task.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-800')}>
                    {task.title}
                  </p>
                  {task.dueAt && <p className="text-xs text-slate-400 mt-0.5 force-ltr">{formatDate(task.dueAt)}</p>}
                </div>
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(task)}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                    aria-label="Edit task"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(task)}
                    className="p-1 rounded hover:bg-danger-50 text-slate-400 hover:text-danger-600"
                    aria-label="Delete task"
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
  )
}

function ContactsTab({
  contacts, onAdd, onEdit, onDelete, t,
}: {
  contacts: Contact[] | null
  onAdd: () => void
  onEdit: (c: Contact) => void
  onDelete: (c: Contact) => void
  t: (key: string) => string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {contacts?.length ?? 0} {(contacts?.length ?? 0) === 1 ? 'contact' : 'contacts'}
        </p>
        <Button size="sm" onClick={onAdd}>
          <Plus className="w-3.5 h-3.5" />
          {t('forms.actions.addContact')}
        </Button>
      </div>

      {!contacts?.length ? (
        <EmptyState
          icon={User}
          title={t('pages.applicationDetail.noContacts')}
          description={t('pages.applicationDetail.noContactsSub')}
          action={{ label: t('forms.actions.addContact'), onClick: onAdd }}
          className="py-16"
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {contacts.map(contact => (
            <Card key={contact.id} padding="sm" className="group relative">
              <div className="flex items-start gap-3">
                <Avatar name={contact.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{contact.name}</p>
                    <ContactTypeBadge type={contact.type} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{contact.title}</p>
                  {contact.email && <p className="text-xs text-primary-600 mt-1 force-ltr">{contact.email}</p>}
                  {contact.phone && <p className="text-xs text-slate-600 force-ltr">{contact.phone}</p>}
                  {contact.lastInteractionAt && (
                    <p className="text-2xs text-slate-400 mt-1">{t('pages.applicationDetail.lastContact')} <span className="force-ltr">{formatRelative(contact.lastInteractionAt)}</span></p>
                  )}
                  {contact.notes && <p className="text-xs text-slate-500 mt-2 leading-snug line-clamp-2">{contact.notes}</p>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => onEdit(contact)}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                    aria-label="Edit contact"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(contact)}
                    className="p-1 rounded hover:bg-danger-50 text-slate-400 hover:text-danger-600"
                    aria-label="Delete contact"
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
  )
}

function FilesTab({
  cv,
  applicationId,
  appDocuments,
  t,
}: {
  cv: CVVersion | undefined
  applicationId: string
  appDocuments: Document[]
  t: (key: string) => string
}) {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [cvUploadOpen, setCvUploadOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* ── Submitted CV ──────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700">{t('pages.applicationDetail.submittedCvHeader')}</p>
          <Button variant="outline" size="sm" onClick={() => setCvUploadOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            {cv ? 'Replace CV' : 'Upload CV'}
          </Button>
        </div>
        {cv ? (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-800">{cv.name}</p>
                <span className="text-2xs bg-success-100 text-success-700 px-1.5 py-0.5 rounded font-medium">{t('pages.applicationDetail.submittedBadge')}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 force-ltr">{cv.fileName}</p>
              {cv.fileSize && <p className="text-xs text-slate-400">{formatFileSize(cv.fileSize)}</p>}
              <p className="text-xs text-slate-400 mt-1">{cv.emphasis}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {cv.skillsHighlighted.slice(0, 5).map(s => (
                  <span key={s} className="text-2xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full force-ltr">{s}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {cv.storagePath ? (
                <CVViewerButton storagePath={cv.storagePath} label={t('pages.applicationDetail.viewFile')} />
              ) : (
                <Link to="/documents">
                  <Button variant="outline" size="sm">{t('pages.applicationDetail.viewInDocuments')}</Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">{t('pages.applicationDetail.noCvLinked')}</p>
        )}
      </Card>

      {/* ── Application documents ─────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700">{t('pages.applicationDetail.applicationFiles')}</p>
          <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            {t('pages.applicationDetail.uploadDocument')}
          </Button>
        </div>
        {appDocuments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('pages.applicationDetail.noFilesYet')}
            description={t('pages.applicationDetail.noFilesYetSub')}
            className="py-6"
          />
        ) : (
          <div className="space-y-2">
            {appDocuments.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate force-ltr">{doc.name}</p>
                  <p className="text-xs text-slate-400">{doc.type}{doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ''}</p>
                </div>
                {doc.storagePath && (
                  <DocumentViewerButton storagePath={doc.storagePath} />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <DocumentUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        applicationId={applicationId}
      />

      <CVUploadDialog
        open={cvUploadOpen}
        onClose={() => setCvUploadOpen(false)}
        applicationId={applicationId}
      />
    </div>
  )
}

function NotesTab({ notes, t }: { notes?: string; t: (key: string) => string }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">{t('pages.applicationDetail.notesHeader')}</h3>
      </div>
      {notes ? (
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{notes}</p>
      ) : (
        <EmptyState icon={MessageSquare} title={t('pages.applicationDetail.noNotes')} description={t('pages.applicationDetail.noNotesSub')} className="py-8" />
      )}
    </Card>
  )
}

function AITab({ app, summaries, t }: { app: { id: string; companyName: string; roleName: string }; summaries: Awaited<ReturnType<typeof aiService.getByApplication>> | null; t: (key: string) => string }) {
  const AI_SHORTCUTS = [
    { label: t('pages.ai.tools.companySummary.label'),       desc: `Get AI insights on ${app.companyName}`, to: `/ai?tool=company-summary&appId=${app.id}`, color: 'bg-primary-50 border-primary-200' },
    { label: t('pages.ai.tools.jdParser.label'),             desc: 'Extract key requirements',              to: `/ai?tool=jd-parser&appId=${app.id}`,        color: 'bg-violet-50 border-violet-200' },
    { label: t('pages.ai.tools.prepPack.label'),             desc: `Prep plan for ${app.roleName}`,         to: `/ai?tool=prepare-me&appId=${app.id}`,        color: 'bg-warning-50 border-warning-200' },
    { label: t('pages.ai.tools.interviewSummary.label'),     desc: 'Summarize a past interview',            to: `/ai?tool=interview-summary&appId=${app.id}`, color: 'bg-success-50 border-success-200' },
    { label: t('pages.ai.tools.followUp.label'),             desc: 'Draft a follow-up email',               to: `/ai?tool=followup&appId=${app.id}`,          color: 'bg-slate-50 border-slate-200' },
    { label: t('pages.ai.tools.personalizedAnswer.label'),   desc: 'Generate a STAR answer',                to: `/ai?tool=personalized&appId=${app.id}`,      color: 'bg-danger-50 border-danger-200' },
  ]

  const prepPacks = summaries?.filter(s => s.toolType === 'Prepare Me') ?? []
  const others    = summaries?.filter(s => s.toolType !== 'Prepare Me') ?? []

  return (
    <div className="space-y-4">
      {/* Quick-launch shortcuts */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {AI_SHORTCUTS.map(tool => (
          <Link key={tool.label} to={tool.to}>
            <Card hover padding="sm" className={cn('border', tool.color)}>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-800">{tool.label}</p>
              </div>
              <p className="text-xs text-slate-500">{tool.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Saved prep packs — expanded cards */}
      {prepPacks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">{t('pages.applicationDetail.savedPrepPacks')}</h3>
          {prepPacks.map(pack => (
            <SavedPrepPackCard key={pack.id} pack={pack} t={t} />
          ))}
        </div>
      )}

      {/* Other AI outputs — compact list (AI surface accent) */}
      {others.length > 0 && (
        <Card variant="ai">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('pages.applicationDetail.previousAiOutputs')}</h3>
          <ul className="space-y-2">
            {others.map(s => (
              <li key={s.id} className="flex items-center gap-3 text-sm text-slate-600 py-2 border-b border-slate-50 last:border-0">
                <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="font-medium">{s.toolType}</span>
                {s.isMocked && (
                  <span className="text-2xs text-warning-600 bg-warning-50 border border-warning-200 px-1.5 py-0.5 rounded-full">{t('pages.applicationDetail.mockBadge')}</span>
                )}
                <span className="text-slate-400 text-xs ms-auto force-ltr">{formatDate(s.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function SavedPrepPackCard({ pack, t }: { pack: ReturnType<typeof aiService.getByApplication> extends Promise<infer T> ? T extends Array<infer U> ? U : never : never; t: (key: string) => string }) {
  const [expanded, setExpanded] = useState(false)
  const keyFields = ['companySnapshot', 'finalChecklist', 'questionsToAsk']
  const preview = Object.entries(pack.outputData)
    .filter(([k]) => keyFields.includes(k))
    .slice(0, 2)

  return (
    <Card padding="sm" className="border-warning-200/60 bg-warning-50/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-warning-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-800">{t('pages.applicationDetail.prepPack')}</p>
            <p className="text-xs text-slate-400 force-ltr">{formatDate(pack.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pack.isMocked && (
            <span className="text-2xs text-warning-600 bg-warning-50 border border-warning-200 px-1.5 py-0.5 rounded-full">{t('pages.applicationDetail.mockBadge')}</span>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium"
          >
            {expanded ? t('pages.applicationDetail.collapse') : t('pages.applicationDetail.expand')}
          </button>
        </div>
      </div>

      {!expanded && preview.length > 0 && (
        <div className="mt-2 space-y-1">
          {preview.map(([k, v]) => (
            <p key={k} className="text-xs text-slate-500 leading-snug line-clamp-2">{v}</p>
          ))}
        </div>
      )}

      {expanded && (
        <div className="mt-3 space-y-3 pt-3 border-t border-warning-100">
          {Object.entries(pack.outputData).map(([k, v]) => {
            let parsed: unknown = v
            try { parsed = JSON.parse(v) } catch { /* not JSON */ }
            const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())
            return (
              <div key={k}>
                <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                {Array.isArray(parsed) ? (
                  <ul className="space-y-0.5">
                    {(parsed as string[]).slice(0, 5).map((item, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-slate-300 shrink-0">•</span>{item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-600 leading-relaxed">{String(parsed)}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
