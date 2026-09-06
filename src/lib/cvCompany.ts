// ---------------------------------------------------------------------------
// InterviewFlow — cvCompany.ts
// Which company a CV version belongs to.
//
// CV rows do not store a company, and asking for one would be a field to fill
// in for something already written in the name ("CV-SWE-Google"). So it is
// inferred, best evidence first, and a wrong guess costs nothing: the logo
// 404s and the card falls back to its version badge.
// ---------------------------------------------------------------------------

export interface CvCompanyHint {
  name:     string
  /** Only present when the company is known to the CRM. */
  logoUrl?: string
}

interface CvLike  { id: string; name: string }
interface AppLike {
  id:              string
  companyName:     string
  companyLogoUrl?: string
  submittedCvId?:  string
}

/** Words that trail a CV name without naming a company. */
const GENERIC = new Set([
  'cv', 'resume', 'general', 'generic', 'master', 'base', 'main', 'draft',
  'final', 'latest', 'old', 'new', 'copy', 'en', 'he', 'english', 'hebrew',
  'pm', 'swe', 'de', 'data', 'product',
  'קורות', 'חיים', 'כללי', 'עדכני', 'סופי',
])

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9֐-׿]/g, '')

/**
 * The trailing segment of a CV name, when it looks like a company.
 * "CV-Data Engineer – Amazon" → "Amazon";  "CV-General" → undefined.
 */
export function companyFromCvName(cvName: string): string | undefined {
  const parts = (cvName ?? '')
    .split(/[-–—_|/\\]+/)
    .map(p => p.trim())
    .filter(Boolean)
  if (parts.length < 2) return undefined

  const last = parts[parts.length - 1]
  if (last.length < 3) return undefined
  if (GENERIC.has(normalize(last))) return undefined
  // A trailing year or version is not a company.
  if (/^[\d.v\s]+$/i.test(last)) return undefined
  return last
}

/**
 * Resolve a CV to a company, preferring what the CRM already knows over what
 * the file name suggests — an application that was submitted with this CV
 * carries the real company row, logo included.
 */
export function companyForCv(cv: CvLike, apps: AppLike[]): CvCompanyHint | null {
  const submitted = apps.find(a => a.submittedCvId === cv.id)
  if (submitted?.companyName) {
    return { name: submitted.companyName, logoUrl: submitted.companyLogoUrl }
  }

  // A company the CRM knows beats the file name, and it can sit anywhere in
  // the name — "CV-Google-SWE" names the company in the middle.
  const segments = (cv.name ?? '').split(/[-–—_|/\\]+/).map(p => normalize(p)).filter(Boolean)
  const known = apps.find(a => segments.includes(normalize(a.companyName)))
  if (known) return { name: known.companyName, logoUrl: known.companyLogoUrl }

  const guess = companyFromCvName(cv.name)
  return guess ? { name: guess } : null
}
