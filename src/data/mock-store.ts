// ---------------------------------------------------------------------------
// InterviewFlow — mock-store.ts
// Module-level mutable in-memory store with **localStorage persistence**.
// Services use this so CRUD operations survive page refresh in mock mode.
//
// Schema:
//   key  = `interviewflow_mock_v1_<collection>`   ← real user data
//   key  = `interviewflow_demo_v1_<collection>`   ← demo workspace data
//   body = JSON.stringify(items)
//
// DATA SAFETY RULES — read before touching this file:
//
//   1. REAL data (REAL_PREFIX) must NEVER be cleared, overwritten, or
//      reseeded automatically. The only permitted mutations are:
//      (a) user-initiated CRUD via mockStore.*.create/update/delete
//      (b) user-initiated "Start fresh" in Settings (current mode only)
//      (c) user-initiated Import from backup (importData)
//
//   2. DEMO data (DEMO_PREFIX) may be cleared when SEED_VERSION changes
//      so that updated seed data is reflected for demo presentations.
//
//   3. clearStaleDemoCache() touches ONLY DEMO_PREFIX keys. It must
//      never reference REAL_PREFIX.
//
//   4. __resetAll() and __clearAll() operate on the CURRENT mode's
//      namespace via storageKey(). Do NOT call these from application
//      code — they are only for explicit user actions in Settings.
//
//   5. Export reads from localStorage. Import writes to REAL_PREFIX only,
//      regardless of the current mode.
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
// Storage namespaces — keep these two prefixes strictly separate.
// REAL_PREFIX = real user data. DEMO_PREFIX = demo workspace.
// ---------------------------------------------------------------------------
const REAL_PREFIX  = 'interviewflow_mock_v1_'
const DEMO_PREFIX  = 'interviewflow_demo_v1_'
const MODE_KEY     = 'interviewflow.dataMode'
// Bump SEED_VERSION whenever demo seed data changes — clears ONLY demo cache.
const SEED_VERSION = 'v3-real-companies-2026-05'

const COLLECTION_NAMES = [
  'applications', 'companies', 'tasks', 'contacts', 'events',
  'cvVersions', 'documents', 'prep', 'ai', 'activity',
] as const
type CollectionName = typeof COLLECTION_NAMES[number]

export type DataMode = 'real' | 'demo'

export function getDataMode(): DataMode {
  if (typeof localStorage === 'undefined') return 'real'
  try {
    return localStorage.getItem(MODE_KEY) === 'demo' ? 'demo' : 'real'
  } catch { return 'real' }
}

/** Switch data mode and reload so all collections re-hydrate from the new namespace. */
export function setDataMode(mode: DataMode): void {
  if (typeof localStorage === 'undefined') return
  try {
    if (mode === 'real') localStorage.removeItem(MODE_KEY)
    else localStorage.setItem(MODE_KEY, 'demo')
  } catch { /* ignore */ }
  if (typeof window !== 'undefined') window.location.reload()
}

function storageKey(name: string): string {
  return (getDataMode() === 'demo' ? DEMO_PREFIX : REAL_PREFIX) + name
}

// ---------------------------------------------------------------------------
// Demo-only cache invalidation — NEVER touches REAL_PREFIX.
// ---------------------------------------------------------------------------
function clearStaleDemoCache(): void {
  if (typeof localStorage === 'undefined') return
  try {
    const versionKey = DEMO_PREFIX + '__seedVersion'
    if (localStorage.getItem(versionKey) !== SEED_VERSION) {
      // Only wipe DEMO_PREFIX keys — real data is untouched.
      for (const n of COLLECTION_NAMES) localStorage.removeItem(DEMO_PREFIX + n)
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
  } catch { /* quota exceeded or private browsing — in-memory state still works */ }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function newId(): string {
  return `${Math.random().toString(36).slice(2, 9)}-${Math.random().toString(36).slice(2, 9)}`
}
const now = () => new Date().toISOString()

// ---------------------------------------------------------------------------
// Generic store factory
// ---------------------------------------------------------------------------
function makeStore<T extends { id: string; createdAt: string }>(
  name: string,
  getRef: () => T[],
  setRef: (items: T[]) => void,
  defaults: Partial<Omit<T, 'id' | 'createdAt'>>
) {
  const save = (items: T[]) => { setRef(items); persist(name, items) }
  return {
    list:    (): T[]                 => [...getRef()],
    getById: (id: string): T | null  => getRef().find(x => x.id === id) ?? null,
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
// In-memory collections — hydrated from localStorage on module init.
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
// Exported CRUD store
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
    { questionId: '', question: '', category: 'HR / Personality', answer: '', confidence: 3, isReady: false, lastUpdatedAt: now() }
  ),
  ai: {
    list:    (): AISummary[]                     => [..._ai],
    getById: (id: string): AISummary | null      => _ai.find(x => x.id === id) ?? null,
    create:  (data: Partial<AISummary>): AISummary => {
      const item = { toolType: 'Company Summary', inputData: {}, outputData: {}, isMocked: true, ...data, id: newId(), createdAt: now() } as AISummary
      _ai = [item, ..._ai]
      persist('ai', _ai)
      return item
    },
    delete:  (id: string): void => { _ai = _ai.filter(x => x.id !== id); persist('ai', _ai) },
  },
  activity: {
    list:    (): RecentActivity[]                          => [..._activity],
    prepend: (item: Omit<RecentActivity, 'id' | 'createdAt'>): RecentActivity => {
      const full = { ...item, id: newId(), createdAt: now() } as RecentActivity
      _activity = [full, ..._activity].slice(0, 50)
      persist('activity', _activity)
      return full
    },
  },

  /** Wipe CURRENT MODE data and reseed from static defaults.
   *  Safe for demo mode. In real mode — only call on explicit user request. */
  __resetAll(): void {
    if (typeof localStorage !== 'undefined') {
      for (const n of COLLECTION_NAMES) {
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

  /** Wipe CURRENT MODE data and persist empty state (no re-seed).
   *  Safe for demo mode. In real mode — only call on explicit user request. */
  __clearAll(): void {
    _apps = []; _companies = []; _tasks = []; _contacts = []; _events = []
    _cvVersions = []; _documents = []; _prep = []; _ai = []; _activity = []
    for (const n of COLLECTION_NAMES) persist(n, [])
  },
}

// ---------------------------------------------------------------------------
// Export / Import — data backup and restore
// ---------------------------------------------------------------------------

export interface BackupPayload {
  appName: string
  exportVersion: string
  exportedAt: string
  dataMode: DataMode
  data: Record<string, unknown[]>
}

export type ParseResult =
  | { ok: true; payload: BackupPayload }
  | { ok: false; error: string }

/**
 * Download all data for the current mode as a JSON backup file.
 * Reads directly from localStorage so every persisted change is included.
 * API keys are intentionally excluded.
 */
export function exportData(): void {
  if (typeof localStorage === 'undefined' || typeof window === 'undefined') return
  const mode   = getDataMode()
  const prefix = mode === 'demo' ? DEMO_PREFIX : REAL_PREFIX

  const data: Record<string, unknown[]> = {}
  for (const name of COLLECTION_NAMES) {
    try {
      const raw = localStorage.getItem(prefix + name)
      data[name] = raw ? (JSON.parse(raw) as unknown[]) : []
    } catch {
      data[name] = []
    }
  }

  const payload: BackupPayload = {
    appName: 'InterviewFlow',
    exportVersion: '1',
    exportedAt: new Date().toISOString(),
    dataMode: mode,
    data,
  }

  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `interviewflow-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Parse and validate a backup file JSON string.
 * Returns the payload on success, or an error message on failure.
 */
export function parseImportFile(json: string): ParseResult {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>
    if (
      parsed['appName'] !== 'InterviewFlow' ||
      typeof parsed['exportVersion'] !== 'string' ||
      typeof parsed['data'] !== 'object' ||
      parsed['data'] === null
    ) {
      return { ok: false, error: 'Invalid file — not an InterviewFlow backup.' }
    }
    return { ok: true, payload: parsed as unknown as BackupPayload }
  } catch {
    return { ok: false, error: 'Could not read file. Make sure it is a valid InterviewFlow backup JSON.' }
  }
}

/**
 * Restore data from a validated backup payload.
 * ALWAYS writes to REAL_PREFIX regardless of current mode.
 * Triggers a page reload so in-memory state re-hydrates from the restored data.
 */
export function importData(payload: BackupPayload): void {
  if (typeof localStorage === 'undefined') return
  for (const name of COLLECTION_NAMES) {
    const items = payload.data[name]
    if (Array.isArray(items)) {
      try {
        // Explicitly use REAL_PREFIX — never import into demo namespace.
        localStorage.setItem(REAL_PREFIX + name, JSON.stringify(items))
      } catch { /* quota exceeded — skip this collection */ }
    }
  }
  if (typeof window !== 'undefined') window.location.reload()
}
