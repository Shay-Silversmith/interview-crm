import { useState, useEffect } from 'react'
import type { JobApplication } from '@/types'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  ArrowLeft, ExternalLink, Calendar, User, CheckSquare,
  FileText, Sparkles, MessageSquare, MapPin, Briefcase,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { StageBadge, PriorityBadge, StatusBadge, ContactTypeBadge } from '@/components/ui/Badge'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { CompanyLogo, Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useMockStore } from '@/hooks/useMockStore'
import { applicationsService } from '@/services/applicationsService'
import { tasksService } from '@/services/tasksService'
import { contactsService } from '@/services/contactsService'
import { documentsService } from '@/services/documentsService'
import { aiService } from '@/services/aiService'
import { formatDate, formatDateTime, formatRelative } from '@/utils/date'
import { cn } from '@/lib/cn'
import type { InterviewStage, Task, Contact, CVVersion } from '@/types'

const DETAIL_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'jd', label: 'Job Description' },
  { id: 'interviews', label: 'Interviews' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'files', label: 'Files' },
  { id: 'notes', label: 'Notes' },
  { id: 'ai', label: 'AI' },
]

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'overview')

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t) setActiveTab(t)
  }, [searchParams])

  const { data: app, loading } = useMockStore(
    () => applicationsService.getById(id!),
    [id]
  )
  const { data: tasks } = useMockStore(() => tasksService.getByApplication(id!), [id])
  const { data: contacts } = useMockStore(() => contactsService.getByApplication(id!), [id])
  const { data: cvVersions } = useMockStore(() => documentsService.listCVVersions())
  const { data: aiSummaries } = useMockStore(() => aiService.getByApplication(id!), [id])

  const submittedCV = cvVersions?.find(cv => cv.id === app?.submittedCvId)

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
        title="Application not found"
        description="This application may have been removed."
        action={{ label: 'Back to Applications', onClick: () => window.history.back() }}
      />
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back link */}
      <Link to="/applications" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Applications
      </Link>

      {/* Hero */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 mb-4">
        <div className="flex items-start gap-4">
          <CompanyLogo name={app.companyName} size="lg" />
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
              {app.roleUrl && (
                <a
                  href={app.roleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View JD
                </a>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <StageBadge stage={app.stage} />
              <PriorityBadge priority={app.priority} />
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
            <span className="text-xs text-slate-500">Submitted CV:</span>
            <Link to="/documents" className="text-xs text-primary-600 font-medium hover:underline">
              {app.submittedCvName}
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs tabs={DETAIL_TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && <OverviewTab app={app} tasks={tasks} contacts={contacts} />}
        {activeTab === 'jd' && <JDTab app={app} />}
        {activeTab === 'interviews' && <InterviewsTab stages={app.interviewStages} />}
        {activeTab === 'tasks' && <TasksTab tasks={tasks} />}
        {activeTab === 'contacts' && <ContactsTab contacts={contacts} />}
        {activeTab === 'files' && <FilesTab cv={submittedCV} />}
        {activeTab === 'notes' && <NotesTab notes={app.notes} />}
        {activeTab === 'ai' && <AITab app={app} summaries={aiSummaries} />}
      </div>
    </div>
  )
}

function OverviewTab({ app, tasks, contacts }: { app: JobApplication; tasks: Task[] | null; contacts: Contact[] | null }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {app.whyInteresting && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Why Interesting</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{app.whyInteresting}</p>
          </Card>
        )}
        {app.whatToEmphasize && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">What to Emphasize</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{app.whatToEmphasize}</p>
          </Card>
        )}
        {app.nextEventDescription && (
          <Card className="border-primary-200 bg-primary-50/40">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-primary-500" />
              <span className="text-xs font-semibold text-primary-700 uppercase tracking-wide">Next Event</span>
            </div>
            <p className="text-sm font-medium text-slate-800">{app.nextEventDescription}</p>
            {app.nextEventAt && (
              <p className="text-xs text-slate-500 mt-1">{formatDateTime(app.nextEventAt)}</p>
            )}
          </Card>
        )}
      </div>
      <div className="space-y-4">
        {tasks && tasks.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Open Tasks</h3>
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
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Key Contacts</h3>
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

function JDTab({ app }: { app: { jobDescription?: string } }) {
  const parsedFields = {
    'Must-have skills': 'SQL (advanced), Python (Pandas/PySpark), AWS basics, analytical mindset',
    'Nice-to-have': 'Apache Spark, Kafka, data warehousing concepts, Git',
    'Key responsibilities': 'ETL pipeline design, AWS integration (Redshift/Glue/S3/Lambda), cross-team collaboration',
    'Culture signals': 'Customer obsession, bias for action, ownership, comfort with ambiguity',
    'Interview focus': 'SQL problems, Python/Pandas data manipulation, one system design question',
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Full Job Description</h3>
          {app.jobDescription ? (
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {app.jobDescription}
            </div>
          ) : (
            <EmptyState icon={FileText} title="No JD saved" description="Paste the job description to enable AI parsing." className="py-8" />
          )}
        </Card>
      </div>
      <div>
        <Card className="border-violet-200 bg-violet-50/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-violet-800">AI Parsed Fields</h3>
            <span className="ml-auto text-2xs text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded font-medium">Mock</span>
          </div>
          <dl className="space-y-3">
            {Object.entries(parsedFields).map(([k, v]) => (
              <div key={k}>
                <dt className="text-2xs font-semibold text-violet-700 uppercase tracking-wide mb-0.5">{k}</dt>
                <dd className="text-xs text-slate-600 leading-relaxed">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
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

function InterviewsTab({ stages }: { stages: InterviewStage[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (stages.length === 0) {
    return <EmptyState icon={Calendar} title="No interview stages yet" description="Interviews will appear here once scheduled." className="py-16" />
  }

  return (
    <div>
      {stages.map((stage, i) => {
        const outcome = stage.outcome ?? 'Pending'
        const style = OUTCOME_STYLES[outcome] ?? OUTCOME_STYLES.Pending
        const isLast = i === stages.length - 1
        const isExpanded = expandedId === stage.id

        return (
          <div key={stage.id} className="flex gap-4">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div className={cn('w-3 h-3 rounded-full ring-4 mt-5 shrink-0 z-10', style.dot)} />
              {!isLast && <div className="w-px flex-1 bg-slate-200 my-1" />}
            </div>

            {/* Card */}
            <div className={cn('flex-1 mb-3 bg-white rounded-2xl border shadow-card overflow-hidden', style.cardBorder || 'border-slate-200/80')}>
              <button
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50/60 transition-colors"
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
                  <p className="text-xs text-slate-400 mt-0.5">
                    {stage.scheduledAt ? formatDateTime(stage.scheduledAt) : 'Not yet scheduled'}
                    {stage.interviewer && ` · ${stage.interviewer}`}
                  </p>
                </div>
                <span className="text-xs text-slate-400 shrink-0 mt-0.5">
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                  {stage.notes && (
                    <div>
                      <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Notes</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{stage.notes}</p>
                    </div>
                  )}
                  {stage.feedbackReceived && (
                    <div>
                      <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Feedback Received</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{stage.feedbackReceived}</p>
                    </div>
                  )}
                  {stage.nextSteps && (
                    <div>
                      <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Next Steps</p>
                      <p className="text-sm text-slate-600">{stage.nextSteps}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TasksTab({ tasks }: { tasks: Task[] | null }) {
  if (!tasks?.length) return <EmptyState icon={CheckSquare} title="No tasks" description="Tasks for this application will appear here." className="py-16" />
  return (
    <div className="space-y-2">
      {tasks.map(task => (
        <Card key={task.id} padding="sm">
          <div className="flex items-center gap-3">
            <div className={cn('w-2 h-2 rounded-full shrink-0', task.status === 'Done' ? 'bg-success-400' : task.status === 'In Progress' ? 'bg-warning-400' : 'bg-slate-300')} />
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium', task.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-800')}>
                {task.title}
              </p>
              {task.dueAt && <p className="text-xs text-slate-400 mt-0.5">{formatDate(task.dueAt)}</p>}
            </div>
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
        </Card>
      ))}
    </div>
  )
}

function ContactsTab({ contacts }: { contacts: Contact[] | null }) {
  if (!contacts?.length) return <EmptyState icon={User} title="No contacts" description="Link contacts to this application to track relationships." className="py-16" />
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {contacts.map(contact => (
        <Card key={contact.id} padding="sm">
          <div className="flex items-start gap-3">
            <Avatar name={contact.name} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800">{contact.name}</p>
                <ContactTypeBadge type={contact.type} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{contact.title}</p>
              {contact.email && <p className="text-xs text-primary-600 mt-1">{contact.email}</p>}
              {contact.lastInteractionAt && (
                <p className="text-2xs text-slate-400 mt-1">Last contact {formatRelative(contact.lastInteractionAt)}</p>
              )}
              {contact.notes && <p className="text-xs text-slate-500 mt-2 leading-snug line-clamp-2">{contact.notes}</p>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function FilesTab({ cv }: { cv: CVVersion | undefined }) {
  return (
    <div className="space-y-4">
      {cv ? (
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800">{cv.name}</p>
                <span className="text-2xs bg-success-100 text-success-700 px-1.5 py-0.5 rounded font-medium">Submitted</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{cv.fileName}</p>
              <p className="text-xs text-slate-400 mt-1">{cv.emphasis}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {cv.skillsHighlighted.slice(0, 5).map(s => (
                  <span key={s} className="text-2xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
            <Link to="/documents">
              <Button variant="outline" size="sm">View in Documents</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-slate-400">No CV linked to this application.</p>
        </Card>
      )}
      <Card>
        <p className="text-sm font-semibold text-slate-700 mb-3">Other Files</p>
        <EmptyState icon={FileText} title="No additional files" description="File upload coming in Phase 5." className="py-8" />
      </Card>
    </div>
  )
}

function NotesTab({ notes }: { notes?: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Notes</h3>
        <Button variant="outline" size="sm" disabled>Edit (Phase 5)</Button>
      </div>
      {notes ? (
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{notes}</p>
      ) : (
        <EmptyState icon={MessageSquare} title="No notes yet" description="Add notes to track important context." className="py-8" />
      )}
    </Card>
  )
}

function AITab({ app, summaries }: { app: { id: string; companyName: string; roleName: string }; summaries: Awaited<ReturnType<typeof aiService.getByApplication>> | null }) {
  const AI_SHORTCUTS = [
    { label: 'Company Summary', desc: `Get AI insights on ${app.companyName}`, to: `/ai?tool=company-summary&appId=${app.id}`, color: 'bg-primary-50 border-primary-200' },
    { label: 'JD Parser', desc: 'Extract key requirements', to: `/ai?tool=jd-parser&appId=${app.id}`, color: 'bg-violet-50 border-violet-200' },
    { label: 'Prepare Me', desc: `Prep plan for ${app.roleName}`, to: `/ai?tool=prepare-me&appId=${app.id}`, color: 'bg-warning-50 border-warning-200' },
    { label: 'Interview Summary', desc: 'Summarize a past interview', to: `/ai?tool=interview-summary&appId=${app.id}`, color: 'bg-success-50 border-success-200' },
    { label: 'Follow-up Message', desc: 'Draft a follow-up email', to: `/ai?tool=followup&appId=${app.id}`, color: 'bg-slate-50 border-slate-200' },
    { label: 'Personalized Answer', desc: 'Generate a STAR answer', to: `/ai?tool=personalized&appId=${app.id}`, color: 'bg-danger-50 border-danger-200' },
  ]

  return (
    <div className="space-y-4">
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
      {summaries && summaries.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Previous AI Outputs</h3>
          <ul className="space-y-2">
            {summaries.map(s => (
              <li key={s.id} className="flex items-center gap-3 text-sm text-slate-600 py-2 border-b border-slate-50 last:border-0">
                <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="font-medium">{s.toolType}</span>
                <span className="text-slate-400 text-xs ml-auto">{formatDate(s.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
