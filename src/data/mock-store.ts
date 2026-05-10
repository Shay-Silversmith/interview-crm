// ---------------------------------------------------------------------------
// InterviewFlow — mock-store.ts
// Module-level mutable in-memory store. Services use this so CRUD
// operations persist across the browser session in mock mode.
// ---------------------------------------------------------------------------

import type {
  JobApplication, Company, Task, Contact, CalendarEvent,
  CVVersion, Document, PreparedAnswer, AISummary, RecentActivity,
} from '@/types/entities'
import { mockApplications } from './mock-applications'
import { mockCompanies } from './mock-companies'
import { mockTasks } from './mock-tasks'
import { mockContacts } from './mock-contacts'
import { mockCalendarEvents } from './mock-calendar'
import { mockCVVersions, mockDocuments } from './mock-documents'
import { mockPreparedAnswers } from './mock-prep'
import { mockAISummaries } from './mock-ai'
import { mockRecentActivity } from './mock-activity'

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function newId(): string {
  return `${Math.random().toString(36).slice(2, 9)}-${Math.random().toString(36).slice(2, 9)}`
}
const now = () => new Date().toISOString()

// ---------------------------------------------------------------------------
// Generic store factory — only requires id + createdAt
// ---------------------------------------------------------------------------
function makeStore<T extends { id: string; createdAt: string }>(
  getRef: () => T[],
  setRef: (items: T[]) => void,
  defaults: Partial<Omit<T, 'id' | 'createdAt'>>
) {
  return {
    list:    (): T[]            => [...getRef()],
    getById: (id: string): T | null => getRef().find(x => x.id === id) ?? null,
    create: (data: Partial<T>): T => {
      const item = { ...defaults, ...data, id: newId(), createdAt: now() } as T
      setRef([item, ...getRef()])
      return item
    },
    update: (id: string, data: Partial<T>): T => {
      const arr = getRef()
      const idx = arr.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`[mock-store] Item ${id} not found`)
      const updated = { ...arr[idx], ...data } as T
      const next = [...arr]; next[idx] = updated
      setRef(next)
      return { ...updated }
    },
    delete: (id: string): void => setRef(getRef().filter(x => x.id !== id)),
  }
}

// ---------------------------------------------------------------------------
// Mutable arrays — seeded from static mock data on first load
// ---------------------------------------------------------------------------
let _apps:      JobApplication[] = [...mockApplications]
let _companies: Company[]        = [...mockCompanies]
let _tasks:     Task[]           = [...mockTasks]
let _contacts:  Contact[]        = [...mockContacts]
let _events:    CalendarEvent[]  = [...mockCalendarEvents]
let _cvVersions: CVVersion[]     = [...mockCVVersions]
let _documents: Document[]       = [...mockDocuments]
let _prep:      PreparedAnswer[] = [...mockPreparedAnswers]
let _ai:        AISummary[]      = [...mockAISummaries]
let _activity:  RecentActivity[] = [...mockRecentActivity]

// ---------------------------------------------------------------------------
// Exported store
// ---------------------------------------------------------------------------
export const mockStore = {
  applications: makeStore<JobApplication>(
    () => _apps, v => { _apps = v },
    { stage: 'Interested', priority: 'Medium', contactIds: [], taskIds: [], interviewStages: [] }
  ),
  companies: makeStore<Company>(
    () => _companies, v => { _companies = v },
    { name: '', industry: '', size: '1-10', location: '' }
  ),
  tasks: makeStore<Task>(
    () => _tasks, v => { _tasks = v },
    { title: '', category: 'Preparation', priority: 'Medium', status: 'Todo' }
  ),
  contacts: makeStore<Contact>(
    () => _contacts, v => { _contacts = v },
    { name: '', type: 'Recruiter', applicationIds: [] }
  ),
  events: makeStore<CalendarEvent>(
    () => _events, v => { _events = v },
    { title: '', type: 'Interview', startAt: now(), allDay: false }
  ),
  cvVersions: makeStore<CVVersion>(
    () => _cvVersions, v => { _cvVersions = v },
    { name: '', version: 1, emphasis: '', skillsHighlighted: [], projectsHighlighted: [], fileName: '', applicationIds: [], isActive: true }
  ),
  documents: makeStore<Document>(
    () => _documents, v => { _documents = v },
    { name: '', type: 'CV', fileName: '', applicationIds: [] }
  ),
  prep: makeStore<PreparedAnswer>(
    () => _prep, v => { _prep = v },
    { questionId: '', question: '', category: 'Behavioral', answer: '', confidence: 3, isReady: false, lastUpdatedAt: now() }
  ),
  ai: {
    list:     (): AISummary[]            => [..._ai],
    getById:  (id: string): AISummary | null => _ai.find(x => x.id === id) ?? null,
    create:   (data: Partial<AISummary>): AISummary => {
      const item = { toolType: 'Company Summary', inputData: {}, outputData: {}, isMocked: true, ...data, id: newId(), createdAt: now() } as AISummary
      _ai = [item, ..._ai]
      return item
    },
    delete:   (id: string): void => { _ai = _ai.filter(x => x.id !== id) },
  },
  activity: {
    list:    (): RecentActivity[] => [..._activity],
    prepend: (item: Omit<RecentActivity, 'id' | 'createdAt'>): RecentActivity => {
      const full = { ...item, id: newId(), createdAt: now() } as RecentActivity
      _activity = [full, ..._activity].slice(0, 50)
      return full
    },
  },
}
