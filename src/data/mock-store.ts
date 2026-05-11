// ---------------------------------------------------------------------------
// InterviewFlow — mock-store.ts
// Module-level mutable in-memory store with **localStorage persistence**.
// Services use this so CRUD operations survive page refresh in mock mode.
//
// Schema:
//   key  = `interviewflow_mock_v1_<collection>`
//   body = JSON.stringify(items)
//
// On first load each collection hydrates from localStorage, falling back to
// the static seed if no key exists or the JSON is corrupt. Every set also
// writes back to localStorage. To wipe everything: clear localStorage or
// call mockStore.__resetAll().
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
// localStorage helpers
// Two parallel data spaces ("real" and "demo") so the user can flip into a
// demo view for presentations without touching their real data.
// ---------------------------------------------------------------------------
const REAL_PREFIX = 'interviewflow_mock_v1_'
const DEMO_PREFIX = 'interviewflow_demo_v1_'
const MODE_KEY    = 'interviewflow.dataMode'
const SEED_VERSION = 'v2-nvidia-google' // bump when seed data changes — clears all cached localStorage

export type DataMode = 'real' | 'demo'

export function getDataMode(): DataMode {
  if (typeof localStorage === 'undefined') return 'real'
  try {
    const v = localStorage.getItem(MODE_KEY)
    return v === 'demo' ? 'demo' : 'real'
  } catch { return 'real' }
}

/** Switch data mode and reload the page so all collections re-hydrate. */
export function setDataMode(mode: DataMode): void {
  if (typeof localStorage === 'undefined') return
  try {
    if (mode === 'real') localStorage.removeItem(MODE_KEY)
    else localStorage.setItem(MODE_KEY, 'demo')
  } catch { /* ignore */ }
  if (typeof window !== 'undefined') window.location.reload()
}

function storageKey(name: string): string {
  const prefix = getDataMode() === 'demo' ? DEMO_PREFIX : REAL_PREFIX
  return prefix + name
}

// Wipe ONLY demo namespace if seed version changed. Never touch real data.
function clearStaleDemoCache(): void {
  if (typeof localStorage === 'undefined') return
  try {
    const versionKey = DEMO_PREFIX + '__seedVersion'
    if (localStorage.getItem(versionKey) !== SEED_VERSION) {
      const names = ['applications','companies','tasks','contacts','events','cvVersions','documents','prep','ai','activity']
      for (const n of names) localStorage.removeItem(DEMO_PREFIX + n)
      localStorage.setItem(versionKey, SEED_VERSION)
    }
  } catch { /* ignore */ }
}
clearStaleDemoCache()

function loadOrSeed<T>(name: string, seed: T[]): T[] {
  if (typeof localStorage === 'undefined') return [...seed]
  try {
    const raw = localStorage.getItem(storageKey(name))
    if (raw === null) {
      // First time: write the seed so subsequent loads are deterministic
      localStorage.setItem(storageKey(name), JSON.stringify(seed))
      return [...seed]
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [...seed]
    return parsed as T[]
  } catch {
    return [...seed]
  }
}

function persist<T>(name: string, items: T[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(storageKey(name), JSON.stringify(items))
  } catch {
    // Quota exceeded or private browsing — silently ignore; in-memory state still works
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function newId(): string {
  return `${Math.random().toString(36).slice(2, 9)}-${Math.random().toString(36).slice(2, 9)}`
}
const now = () => new Date().toISOString()

// ---------------------------------------------------------------------------
// Generic store factory — only requires id + createdAt.
// Wraps the setter so every mutation persists to localStorage.
// ---------------------------------------------------------------------------
function makeStore<T extends { id: string; createdAt: string }>(
  name: string,
  getRef: () => T[],
  setRef: (items: T[]) => void,
  defaults: Partial<Omit<T, 'id' | 'createdAt'>>
) {
  const save = (items: T[]) => { setRef(items); persist(name, items) }
  return {
    list:    (): T[]            => [...getRef()],
    getById: (id: string): T | null => getRef().find(x => x.id === id) ?? null,
    create: (data: Partial<T>): T => {
      const ts = now()
      const item = { ...defaults, ...data, id: newId(), createdAt: ts, updatedAt: ts } as unknown as T
      save([item, ...getRef()])
      return item
    },
    update: (id: string, data: Partial<T>): T => {
      const arr = getRef()
      const idx = arr.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`[mock-store] Item ${id} not found`)
      const updated = { ...arr[idx], ...data, updatedAt: now() } as T
      const next = [...arr]; next[idx] = updated
      save(next)
      return { ...updated }
    },
    delete: (id: string): void => save(getRef().filter(x => x.id !== id)),
  }
}

// ---------------------------------------------------------------------------
// Mutable arrays — hydrated from localStorage on first import, seeded from
// static mock data when no persisted state exists.
// ---------------------------------------------------------------------------
let _apps:       JobApplication[] = loadOrSeed('applications', mockApplications)
let _companies:  Company[]        = loadOrSeed('companies',    mockCompanies)
let _tasks:      Task[]           = loadOrSeed('tasks',        mockTasks)
let _contacts:   Contact[]        = loadOrSeed('contacts',     mockContacts)
let _events:     CalendarEvent[]  = loadOrSeed('events',       mockCalendarEvents)
let _cvVersions: CVVersion[]      = loadOrSeed('cvVersions',   mockCVVersions)
let _documents:  Document[]       = loadOrSeed('documents',    mockDocuments)
let _prep:       PreparedAnswer[] = loadOrSeed('prep',         mockPreparedAnswers)
let _ai:         AISummary[]      = loadOrSeed('ai',           mockAISummaries)
let _activity:   RecentActivity[] = loadOrSeed('activity',     mockRecentActivity)

// ---------------------------------------------------------------------------
// Exported store
// ---------------------------------------------------------------------------
export const mockStore = {
  applications: makeStore<JobApplication>(
    'applications',
    () => _apps, v => { _apps = v },
    { stage: 'Interested', priority: 'Medium', contactIds: [], taskIds: [], interviewStages: [] }
  ),
  companies: makeStore<Company>(
    'companies',
    () => _companies, v => { _companies = v },
    { name: '', industry: '', size: '1-10', location: '' }
  ),
  tasks: makeStore<Task>(
    'tasks',
    () => _tasks, v => { _tasks = v },
    { title: '', category: 'Preparation', priority: 'Medium', status: 'Todo' }
  ),
  contacts: makeStore<Contact>(
    'contacts',
    () => _contacts, v => { _contacts = v },
    { name: '', type: 'Recruiter', applicationIds: [] }
  ),
  events: makeStore<CalendarEvent>(
    'events',
    () => _events, v => { _events = v },
    { title: '', type: 'Interview', startAt: now(), allDay: false }
  ),
  cvVersions: makeStore<CVVersion>(
    'cvVersions',
    () => _cvVersions, v => { _cvVersions = v },
    { name: '', version: 1, emphasis: '', skillsHighlighted: [], projectsHighlighted: [], fileName: '', applicationIds: [], isActive: true }
  ),
  documents: makeStore<Document>(
    'documents',
    () => _documents, v => { _documents = v },
    { name: '', type: 'CV', fileName: '', applicationIds: [] }
  ),
  prep: makeStore<PreparedAnswer>(
    'prep',
    () => _prep, v => { _prep = v },
    { questionId: '', question: '', category: 'Behavioral', answer: '', confidence: 3, isReady: false, lastUpdatedAt: now() }
  ),
  ai: {
    list:     (): AISummary[]            => [..._ai],
    getById:  (id: string): AISummary | null => _ai.find(x => x.id === id) ?? null,
    create:   (data: Partial<AISummary>): AISummary => {
      const item = { toolType: 'Company Summary', inputData: {}, outputData: {}, isMocked: true, ...data, id: newId(), createdAt: now() } as AISummary
      _ai = [item, ..._ai]
      persist('ai', _ai)
      return item
    },
    delete:   (id: string): void => { _ai = _ai.filter(x => x.id !== id); persist('ai', _ai) },
  },
  activity: {
    list:    (): RecentActivity[] => [..._activity],
    prepend: (item: Omit<RecentActivity, 'id' | 'createdAt'>): RecentActivity => {
      const full = { ...item, id: newId(), createdAt: now() } as RecentActivity
      _activity = [full, ..._activity].slice(0, 50)
      persist('activity', _activity)
      return full
    },
  },

  /** Wipe all persisted mock data and reseed from the static defaults. */
  __resetAll(): void {
    if (typeof localStorage !== 'undefined') {
      const names = ['applications','companies','tasks','contacts','events','cvVersions','documents','prep','ai','activity']
      for (const n of names) {
        try { localStorage.removeItem(storageKey(n)) } catch { /* ignore */ }
      }
    }
    _apps       = [...mockApplications]
    _companies  = [...mockCompanies]
    _tasks      = [...mockTasks]
    _contacts   = [...mockContacts]
    _events     = [...mockCalendarEvents]
    _cvVersions = [...mockCVVersions]
    _documents  = [...mockDocuments]
    _prep       = [...mockPreparedAnswers]
    _ai         = [...mockAISummaries]
    _activity   = [...mockRecentActivity]
  },

  /** Wipe all data and start fully empty (no seed data). Persists empty state
   *  so the next reload doesn't re-seed. Use when the user wants a clean slate. */
  __clearAll(): void {
    _apps = []; _companies = []; _tasks = []; _contacts = []; _events = []
    _cvVersions = []; _documents = []; _prep = []; _ai = []; _activity = []
    persist('applications', _apps)
    persist('companies',    _companies)
    persist('tasks',        _tasks)
    persist('contacts',     _contacts)
    persist('events',       _events)
    persist('cvVersions',   _cvVersions)
    persist('documents',    _documents)
    persist('prep',         _prep)
    persist('ai',           _ai)
    persist('activity',     _activity)
  },
}
