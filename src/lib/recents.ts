// ---------------------------------------------------------------------------
// InterviewFlow — recents.ts
// Lightweight localStorage util for tracking the last 5 visited entities
// so the command palette can show a "Recent" section when query is empty.
// ---------------------------------------------------------------------------

export interface RecentItem {
  id:    string
  type:  'application' | 'company' | 'contact' | 'prep'
  label: string
  sub?:  string
  to:    string
}

const KEY = 'interviewflow:recents'
const MAX = 5

export function getRecents(): RecentItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function trackRecent(item: RecentItem): void {
  const list = getRecents().filter(r => r.id !== item.id)
  list.unshift(item)
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
}
