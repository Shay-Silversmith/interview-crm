// ---------------------------------------------------------------------------
// InterviewFlow — postingFill.ts
// Turning what a posting states into fields an application can store.
//
// The AI route and the application record disagree on one enum ("4 days" vs
// "4 days/week"), so anything that writes a posting into a record goes through
// here rather than each caller learning the mismatch separately.
// ---------------------------------------------------------------------------

import type { ApplicationFillResponse } from '@/services/aiClientService'

export type JobScope = '2 days/week' | '3 days/week' | '4 days/week' | 'Full-time'

export function normalizeJobScope(value?: string | null): JobScope | undefined {
  const v = (value ?? '').trim().toLowerCase()
  if (!v) return undefined
  if (v.startsWith('full')) return 'Full-time'
  const days = v.match(/^([234])\s*day/)
  if (days) return `${days[1]} days/week` as JobScope
  return undefined
}

/** The fields a posting can fill in, already in the record's own shapes. */
export interface PostingFields {
  roleName?:       string
  location?:       string
  workModel?:      'On-site' | 'Hybrid' | 'Remote'
  jobScope?:       JobScope
  salaryMin?:      number
  salaryMax?:      number
  salaryType?:     'Hourly' | 'Monthly'
  currency?:       string
  jobDescription?: string
  whyInteresting?: string
}

/** Drops the nulls the route uses for "the posting did not say". */
export function postingFields(d: ApplicationFillResponse): PostingFields {
  const out: PostingFields = {}
  if (d.roleName)       out.roleName       = d.roleName
  if (d.location)       out.location       = d.location
  if (d.workModel)      out.workModel      = d.workModel
  const scope = normalizeJobScope(d.jobScope)
  if (scope)            out.jobScope       = scope
  if (d.salaryMin  != null) out.salaryMin  = d.salaryMin
  if (d.salaryMax  != null) out.salaryMax  = d.salaryMax
  if (d.salaryType)     out.salaryType     = d.salaryType
  if (d.currency)       out.currency       = d.currency
  if (d.jobDescription) out.jobDescription = d.jobDescription
  if (d.whyInteresting) out.whyInteresting = d.whyInteresting
  return out
}
