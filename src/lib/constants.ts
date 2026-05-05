export const APP_NAME = 'InterviewFlow'
export const APP_VERSION = '1.0.0'

export const SIDEBAR_WIDTH = 240
export const TOPBAR_HEIGHT = 56

export const STAGE_ORDER: string[] = [
  'Interested',
  'Applied',
  'HR Screen',
  'Home Assignment',
  'Technical Interview',
  'Manager Interview',
  'Final Interview',
  'Offer',
  'Rejected',
  'Accepted',
  'Withdrawn',
]

export const PRIORITY_WEIGHT: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
}

export const MOCK_DELAY_MS = 150

export const ROUTES = {
  dashboard: '/',
  applications: '/applications',
  applicationBoard: '/applications/board',
  applicationDetail: (id: string) => `/applications/${id}`,
  companies: '/companies',
  companyDetail: (id: string) => `/companies/${id}`,
  tasks: '/tasks',
  calendar: '/calendar',
  contacts: '/contacts',
  documents: '/documents',
  prep: '/prep',
  ai: '/ai',
  settings: '/settings',
} as const
