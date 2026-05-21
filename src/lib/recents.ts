// ---------------------------------------------------------------------------
// InterviewFlow — recents.ts
// Lightweight localStorage util for tracking the last 5 visited entities
// so the command palette can show a "Recent" section when query is empty.
//
// In Supabase mode the key is scoped to the current user ID so that
// different users sharing a browser don't see each other's recents.
// ---------------------------------------------------------------------------

import { isSupabaseMode } from '@/lib/env'
import { getCurrentUserId } from '@/lib/currentUser'

export interface RecentItem {
  id:    string
  type:  'application' | 'company' | 'contact' | 'prep'
  label: string
  sub?:  string
  to:    string
}

const BASE_KEY = 'interviewflow:recents'
const MAX = 5

function getKey(): string {
  if (isSupabaseMode()) {
    const uid = getCurrentUserId()
    if (uid) return `${BASE_KEY}:${uid}`
  }
  return BASE_KEY
}

export function getRecents(): RecentItem[] {
  try {
    return JSON.parse(localStorage.getItem(getKey()) ?? '[]')
  } catch {
    return []
  }
}

export function trackRecent(item: RecentItem): void {
  const list = getRecents().filter(r => r.id !== item.id)
  list.unshift(item)
  localStorage.setItem(getKey(), JSON.stringify(list.slice(0, MAX)))
}
