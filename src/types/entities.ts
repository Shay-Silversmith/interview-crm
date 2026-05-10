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

export interface UserProfile {
  id: string
  user_id?: string
  name: string
  /** First name or chosen short name shown in greetings and headers. */
  preferredName?: string
  email: string
  phone?: string
  location: string
  university: string
  degree: string
  year: number
  unit?: string
  bio: string
  linkedinUrl?: string
  githubUrl?: string
  targetRoles: string[]
  targetIndustries: string[]
  skills: string[]
  languages: string[]
  defaultPitch?: string
  createdAt: string
  updatedAt: string
}

export interface Company {
  id: string
  user_id?: string
  name: string
  logoUrl?: string
  industry: string
  size: CompanySize
  location: string
  website?: string
  linkedinUrl?: string
  description?: string
  notes?: string
  glassdoorRating?: number
  techStack?: string[]
  createdAt: string
  updatedAt: string
}

export interface InterviewStage {
  id: string
  applicationId: string
  type: InterviewType
  scheduledAt?: string
  completedAt?: string
  duration?: number
  interviewer?: string
  interviewerTitle?: string
  outcome?: InterviewOutcome
  notes?: string
  feedbackReceived?: string
  nextSteps?: string
}

export interface JobApplication {
  id: string
  user_id?: string
  companyId: string
  companyName: string
  /** Denormalized from the Company record for display-only use. Undefined in
   *  Supabase mode (CompanyLogo falls back to initials gracefully). */
  companyLogoUrl?: string
  roleName: string
  roleUrl?: string
  jobDescription?: string
  stage: ApplicationStage
  priority: Priority
  workModel?: WorkModel
  location?: string
  salaryMin?: number
  salaryMax?: number
  currency?: string
  fitScore?: number
  urgencyScore?: number
  submittedCvId?: string
  submittedCvName?: string
  appliedAt?: string
  deadlineAt?: string
  nextEventAt?: string
  nextEventDescription?: string
  contactIds: string[]
  taskIds: string[]
  interviewStages: InterviewStage[]
  notes?: string
  whyInteresting?: string
  whatToEmphasize?: string
  aiSummaryId?: string
  /** Saved output from the JD Parser tool — stored as JSONB in the DB. */
  aiRoleSummary?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  user_id?: string
  title: string
  description?: string
  category: TaskCategory
  priority: Priority
  status: TaskStatus
  dueAt?: string
  applicationId?: string
  applicationName?: string
  companyName?: string
  contactId?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Contact {
  id: string
  user_id?: string
  name: string
  type: ContactType
  company?: string
  companyId?: string
  title?: string
  email?: string
  phone?: string
  linkedinUrl?: string
  applicationIds: string[]
  notes?: string
  lastInteractionAt?: string
  followUpDueAt?: string
  createdAt: string
  updatedAt: string
}

export interface CalendarEvent {
  id: string
  user_id?: string
  title: string
  type: CalendarEventType
  startAt: string
  endAt?: string
  allDay?: boolean
  applicationId?: string
  applicationName?: string
  companyName?: string
  contactId?: string
  description?: string
  location?: string
  meetingUrl?: string
  reminderMinutes?: number
  createdAt: string
  updatedAt: string
}

export interface CVVersion {
  id: string
  user_id?: string
  name: string
  version: number
  emphasis: string
  skillsHighlighted: string[]
  projectsHighlighted: string[]
  fileName: string
  fileSize?: number
  storagePath?: string
  applicationIds: string[]
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Document {
  id: string
  user_id?: string
  name: string
  type: DocumentType
  fileName: string
  fileSize?: number
  storagePath?: string
  applicationIds: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface InterviewQuestion {
  id: string
  category: PrepCategory
  question: string
  tags?: string[]
}

export interface PreparedAnswer {
  id: string
  user_id?: string
  questionId: string
  question: string
  category: PrepCategory
  answer: string
  confidence: ConfidenceLevel
  isReady: boolean
  tags?: string[]
  applicationIds?: string[]
  lastUpdatedAt: string
  createdAt: string
}

export interface AISummary {
  id: string
  user_id?: string
  toolType: AIToolType
  applicationId?: string
  companyId?: string
  inputData: Record<string, string>
  outputData: Record<string, string>
  isMocked: boolean
  createdAt: string
}

export interface RecentActivity {
  id: string
  user_id?: string
  type: ActivityType
  title: string
  description: string
  applicationId?: string
  companyName?: string
  taskId?: string
  createdAt: string
}
