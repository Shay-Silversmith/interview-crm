// ---------------------------------------------------------------------------
// InterviewFlow — mappers.ts
// Maps Supabase DB rows (snake_case) → frontend entities (camelCase).
// Row types mirror 0001_init.sql column names exactly.
// ---------------------------------------------------------------------------

import type {
  UserProfile,
  Company,
  JobApplication,
  InterviewStage,
  Task,
  Contact,
  CalendarEvent,
  CVVersion,
  Document,
  PreparedAnswer,
  AISummary,
  RecentActivity,
} from '@/types/entities'
import type {
  ApplicationStage,
  Priority,
  TaskStatus,
  TaskCategory,
  WorkModel,
  CompanySize,
  ContactType,
  InterviewType,
  InterviewOutcome,
  CalendarEventType,
  DocumentType,
  PrepCategory,
  ConfidenceLevel,
  AIToolType,
  ActivityType,
} from '@/lib/enums'

// ---------------------------------------------------------------------------
// profiles
// ---------------------------------------------------------------------------
export interface ProfileRow {
  id: string
  name: string | null
  display_name: string | null
  email: string | null
  phone: string | null
  location: string | null
  university: string | null
  degree: string | null
  year: number | null
  unit: string | null
  bio: string | null
  linkedin_url: string | null
  github_url: string | null
  target_roles: string[] | null
  target_industries: string[] | null
  skills: string[] | null
  languages: string[] | null
  default_pitch: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export function mapProfile(row: ProfileRow): UserProfile {
  const name = row.name ?? row.display_name ?? ''
  const displayName = row.display_name?.trim() || undefined
  return {
    id: row.id,
    name,
    displayName,
    // preferredName: prefer the stored display_name, otherwise first word of name.
    preferredName: displayName ?? (name ? name.split(' ')[0] : undefined),
    email: row.email ?? '',
    phone: row.phone ?? undefined,
    location: row.location ?? '',
    university: row.university ?? '',
    degree: row.degree ?? '',
    year: row.year ?? 0,
    unit: row.unit ?? undefined,
    bio: row.bio ?? '',
    linkedinUrl: row.linkedin_url ?? undefined,
    githubUrl: row.github_url ?? undefined,
    targetRoles: row.target_roles ?? [],
    targetIndustries: row.target_industries ?? [],
    skills: row.skills ?? [],
    languages: row.languages ?? [],
    defaultPitch: row.default_pitch ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ---------------------------------------------------------------------------
// companies
// ---------------------------------------------------------------------------
export interface CompanyRow {
  id: string
  user_id: string
  name: string
  industry: string | null
  size: string | null
  location: string | null
  website: string | null
  linkedin_url: string | null
  description: string | null
  notes: string | null
  glassdoor_rating: number | null
  tech_stack: string[]
  logo_url: string | null
  created_at: string
  updated_at: string
}

export function mapCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    logoUrl: row.logo_url ?? undefined,
    industry: row.industry ?? '',
    size: (row.size as CompanySize) ?? '1-10',
    location: row.location ?? '',
    website: row.website ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    description: row.description ?? undefined,
    notes: row.notes ?? undefined,
    glassdoorRating: row.glassdoor_rating ?? undefined,
    techStack: row.tech_stack,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ---------------------------------------------------------------------------
// job_applications
// ---------------------------------------------------------------------------
export interface ApplicationRow {
  id: string
  user_id: string
  company_id: string
  company_name: string
  company_logo_url: string | null
  role_name: string
  role_url: string | null
  job_description: string | null
  stage: string
  priority: string
  work_model: string | null
  location: string | null
  salary_min: number | null
  salary_max: number | null
  currency: string | null
  fit_score: number | null
  urgency_score: number | null
  why_interesting: string | null
  what_to_emphasize: string | null
  notes: string | null
  submitted_cv_version_id: string | null
  submitted_cv_name: string | null
  applied_at: string | null
  deadline_at: string | null
  next_event_at: string | null
  next_event_description: string | null
  ai_role_summary: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export function mapApplication(row: ApplicationRow): JobApplication {
  return {
    id: row.id,
    user_id: row.user_id,
    companyId: row.company_id,
    companyName: row.company_name,
    // Denormalised onto the application row so the list does not need a JOIN.
    // CompanyLogo derives one from the company name when this is empty.
    companyLogoUrl: row.company_logo_url ?? undefined,
    roleName: row.role_name,
    roleUrl: row.role_url ?? undefined,
    jobDescription: row.job_description ?? undefined,
    stage: row.stage as ApplicationStage,
    priority: row.priority as Priority,
    workModel: row.work_model ? (row.work_model as WorkModel) : undefined,
    location: row.location ?? undefined,
    salaryMin: row.salary_min ?? undefined,
    salaryMax: row.salary_max ?? undefined,
    currency: row.currency ?? undefined,
    fitScore: row.fit_score ?? undefined,
    urgencyScore: row.urgency_score ?? undefined,
    submittedCvId: row.submitted_cv_version_id ?? undefined,
    submittedCvName: row.submitted_cv_name ?? undefined,
    appliedAt: row.applied_at ?? undefined,
    deadlineAt: row.deadline_at ?? undefined,
    nextEventAt: row.next_event_at ?? undefined,
    nextEventDescription: row.next_event_description ?? undefined,
    whyInteresting: row.why_interesting ?? undefined,
    whatToEmphasize: row.what_to_emphasize ?? undefined,
    notes: row.notes ?? undefined,
    aiRoleSummary: row.ai_role_summary ?? undefined,
    // Relational fields — populated in getById; empty list for list queries
    contactIds: [],
    taskIds: [],
    interviewStages: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ---------------------------------------------------------------------------
// interview_stages
// ---------------------------------------------------------------------------
export interface InterviewStageRow {
  id: string
  user_id: string
  application_id: string
  type: string
  stage_order: number
  scheduled_at: string | null
  completed_at: string | null
  duration_minutes: number | null
  interviewer: string | null
  interviewer_title: string | null
  outcome: string
  notes: string | null
  feedback_received: string | null
  next_steps: string | null
  created_at: string
  updated_at: string
}

export function mapInterviewStage(row: InterviewStageRow): InterviewStage {
  return {
    id: row.id,
    applicationId: row.application_id,
    type: row.type as InterviewType,
    scheduledAt: row.scheduled_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    duration: row.duration_minutes ?? undefined,
    interviewer: row.interviewer ?? undefined,
    interviewerTitle: row.interviewer_title ?? undefined,
    outcome: row.outcome as InterviewOutcome,
    notes: row.notes ?? undefined,
    feedbackReceived: row.feedback_received ?? undefined,
    nextSteps: row.next_steps ?? undefined,
  }
}

// ---------------------------------------------------------------------------
// tasks
// ---------------------------------------------------------------------------
export interface TaskRow {
  id: string
  user_id: string
  application_id: string | null
  company_id: string | null
  company_name: string | null
  title: string
  description: string | null
  category: string
  status: string
  priority: string
  due_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    category: row.category as TaskCategory,
    priority: row.priority as Priority,
    status: row.status as TaskStatus,
    dueAt: row.due_at ?? undefined,
    applicationId: row.application_id ?? undefined,
    applicationName: undefined, // not stored in DB
    companyName: row.company_name ?? undefined,
    contactId: undefined, // no contact_id on tasks table
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ---------------------------------------------------------------------------
// contacts
// ---------------------------------------------------------------------------
export interface ContactRow {
  id: string
  user_id: string
  company_id: string | null
  application_id: string | null
  name: string
  title: string | null
  company_name: string | null
  email: string | null
  linkedin_url: string | null
  type: string
  notes: string | null
  last_interaction_at: string | null
  follow_up_due_at: string | null
  created_at: string
  updated_at: string
}

export function mapContact(row: ContactRow): Contact {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    type: row.type as ContactType,
    company: row.company_name ?? undefined,
    companyId: row.company_id ?? undefined,
    title: row.title ?? undefined,
    email: row.email ?? undefined,
    phone: undefined, // no phone column in DB
    linkedinUrl: row.linkedin_url ?? undefined,
    // application_id is a single FK in DB; entity expects an array
    applicationIds: row.application_id ? [row.application_id] : [],
    notes: row.notes ?? undefined,
    lastInteractionAt: row.last_interaction_at ?? undefined,
    followUpDueAt: row.follow_up_due_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ---------------------------------------------------------------------------
// calendar_events
// ---------------------------------------------------------------------------
export interface CalendarEventRow {
  id: string
  user_id: string
  application_id: string | null
  contact_id: string | null
  title: string
  type: string
  company_name: string | null
  application_name: string | null
  start_at: string
  end_at: string | null
  all_day: boolean
  location: string | null
  meeting_url: string | null
  description: string | null
  reminder_minutes: number | null
  created_at: string
  updated_at: string
}

export function mapCalendarEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    type: row.type as CalendarEventType,
    startAt: row.start_at,
    endAt: row.end_at ?? undefined,
    allDay: row.all_day,
    applicationId: row.application_id ?? undefined,
    applicationName: row.application_name ?? undefined,
    companyName: row.company_name ?? undefined,
    contactId: row.contact_id ?? undefined,
    description: row.description ?? undefined,
    location: row.location ?? undefined,
    meetingUrl: row.meeting_url ?? undefined,
    reminderMinutes: row.reminder_minutes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ---------------------------------------------------------------------------
// cv_versions
// ---------------------------------------------------------------------------
export interface CVVersionRow {
  id: string
  user_id: string
  name: string
  version_number: number
  emphasis: string | null
  skills_highlighted: string[]
  projects_highlighted: string[]
  file_name: string | null
  file_size: number | null
  storage_path: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export function mapCVVersion(row: CVVersionRow): CVVersion {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    version: row.version_number,
    emphasis: row.emphasis ?? '',
    skillsHighlighted: row.skills_highlighted,
    projectsHighlighted: row.projects_highlighted,
    fileName: row.file_name ?? '',
    fileSize: row.file_size ?? undefined,
    storagePath: row.storage_path ?? undefined,
    applicationIds: [], // applications reference CV via submitted_cv_version_id
    notes: row.notes ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ---------------------------------------------------------------------------
// documents
// ---------------------------------------------------------------------------
export interface DocumentRow {
  id: string
  user_id: string
  application_id: string | null
  name: string
  type: string
  file_name: string | null
  file_size: number | null
  storage_path: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export function mapDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    type: row.type as DocumentType,
    fileName: row.file_name ?? '',
    fileSize: row.file_size ?? undefined,
    storagePath: row.storage_path ?? undefined,
    applicationIds: row.application_id ? [row.application_id] : [],
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ---------------------------------------------------------------------------
// prepared_answers
// ---------------------------------------------------------------------------
export interface PreparedAnswerRow {
  id: string
  user_id: string
  application_id: string | null
  question: string
  category: string
  answer: string | null
  tags: string[]
  confidence: number | null   // integer 1-5
  is_ready: boolean
  last_updated_at: string | null
  created_at: string
  updated_at: string
}

export function mapPreparedAnswer(row: PreparedAnswerRow): PreparedAnswer {
  return {
    id: row.id,
    user_id: row.user_id,
    questionId: row.id, // no separate question table; use own id
    question: row.question,
    category: row.category as PrepCategory,
    answer: row.answer ?? '',
    confidence: (row.confidence ?? 3) as ConfidenceLevel,
    isReady: row.is_ready,
    tags: row.tags.length > 0 ? row.tags : undefined,
    applicationIds: row.application_id ? [row.application_id] : [],
    lastUpdatedAt: row.last_updated_at ?? row.updated_at,
    createdAt: row.created_at,
  }
}

// ---------------------------------------------------------------------------
// ai_summaries
// ---------------------------------------------------------------------------
export interface AISummaryRow {
  id: string
  user_id: string
  tool_type: string
  entity_type: string
  entity_id: string | null
  input_data: Record<string, string>
  output_data: Record<string, string>
  is_mocked: boolean
  created_at: string
  updated_at: string
}

export function mapAISummary(row: AISummaryRow): AISummary {
  return {
    id: row.id,
    user_id: row.user_id,
    toolType: row.tool_type as AIToolType,
    applicationId:
      row.entity_type === 'application' ? (row.entity_id ?? undefined) : undefined,
    companyId: row.entity_type === 'company' ? (row.entity_id ?? undefined) : undefined,
    inputData: row.input_data,
    outputData: row.output_data,
    isMocked: row.is_mocked,
    createdAt: row.created_at,
  }
}

// ---------------------------------------------------------------------------
// recent_activity
// ---------------------------------------------------------------------------
export interface RecentActivityRow {
  id: string
  user_id: string
  activity_type: string
  entity_type: string
  entity_id: string | null
  title: string
  description: string | null
  metadata: Record<string, string> | null
  created_at: string
  updated_at: string
}

export function mapRecentActivity(row: RecentActivityRow): RecentActivity {
  const metadata = row.metadata ?? {}
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.activity_type as ActivityType,
    title: row.title,
    description: row.description ?? '',
    applicationId:
      row.entity_type === 'application' ? (row.entity_id ?? undefined) : undefined,
    taskId: row.entity_type === 'task' ? (row.entity_id ?? undefined) : undefined,
    companyName: metadata.company_name ?? undefined,
    createdAt: row.created_at,
  }
}

/**
 * App -> DB direction for profile edits.
 *
 * mapProfile() converts snake_case rows into camelCase objects; without the
 * inverse, an update would send keys like `targetRoles`, which are not columns
 * and make Postgres reject the whole statement. Only keys actually present on
 * the patch are emitted, so a partial edit stays partial.
 */
export function toProfileUpdate(p: Partial<UserProfile>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const put = <K extends keyof UserProfile>(key: K, column: string) => {
    if (p[key] !== undefined) out[column] = p[key]
  }
  put('name',             'name')
  put('displayName',      'display_name')
  put('phone',            'phone')
  put('location',         'location')
  put('university',       'university')
  put('degree',           'degree')
  put('year',             'year')
  put('unit',             'unit')
  put('bio',              'bio')
  put('linkedinUrl',      'linkedin_url')
  put('githubUrl',        'github_url')
  put('targetRoles',      'target_roles')
  put('targetIndustries', 'target_industries')
  put('skills',           'skills')
  put('languages',        'languages')
  put('defaultPitch',     'default_pitch')
  return out
}
