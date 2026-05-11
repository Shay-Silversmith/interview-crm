// ---------------------------------------------------------------------------
// InterviewFlow — src/services/aiClientService.ts
// Client-side fetch wrappers for the three live AI serverless functions.
// The browser NEVER sees the Anthropic API key — all calls go through /api/ai/*.
// ---------------------------------------------------------------------------

// Mirror the response shapes from api/ai/_lib/schemas.ts
// (We duplicate the types here so src/ stays isolated from api/)

export interface JDParserResponse {
  roleSummary:         string
  responsibilities:    string[]
  requirements:        string[]
  niceToHaves:         string[]
  technologies:        string[]
  whatTheyWant:        string
  howIMatch:           string[]
  whatToEmphasize:     string[]
  possibleQuestions:   string[]
  prepChecklist:       string[]
}

export interface StarStory {
  situation: string
  task:      string
  action:    string
  result:    string
}

export interface PrepPackResponse {
  companySnapshot:             string
  roleSummary:                 string
  reviewFromCV:                string[]
  expectedHRQuestions:         string[]
  expectedTechnicalQuestions:  string[]
  recommendedStarStories:      StarStory[]
  questionsToAsk:              string[]
  finalChecklist:              string[]
}

export interface FollowUpResponse {
  short:    string
  warm:     string
  linkedIn: string
}

export type AIResult<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string }

// ---------------------------------------------------------------------------
// Request types (mirrors schemas.ts but lives in src/ for TS consumers)
// ---------------------------------------------------------------------------

export type AILocale = 'en' | 'he'

export interface JDParserRequest {
  jdText:         string
  roleTitle?:     string
  userBackground?: string
  // locale is accepted by the endpoint but intentionally ignored (JD output stays English).
  locale?:        AILocale
}

export interface PrepPackRequest {
  application: {
    title:         string
    company:       string
    stage:         string
    jdText?:       string
    aiRoleSummary?: string
    notes?:        string
  }
  cv: {
    emphasis:            string
    skillsHighlighted:   string[]
    projectsHighlighted: string[]
  } | null
  company: {
    name:               string
    summary?:           string
    productDescription?: string
  } | null
  pastInterviews: Array<{
    type:         string
    questions:    string[]
    roughAnswers: string[]
    takeaways:    string
  }>
  userBackground: string
  interviewType:  string
  locale?:        AILocale
}

export type MessageType = 'post-interview' | 'ping-after-silence' | 'thank-you' | 'decline-politely'
export type Tone        = 'professional' | 'warm' | 'casual'

export interface FollowUpRequest {
  messageType:  MessageType
  company:      string
  contactName:  string
  role:         string
  tone:         Tone
  context:      string
  locale?:      AILocale
}

// ---------------------------------------------------------------------------
// Company auto-fill — research a company by name, return structured fields
// ---------------------------------------------------------------------------

export type CompanySize =
  | '1-10' | '11-50' | '51-200' | '201-500' | '501-2000' | '2001-10000' | '10000+'

export interface CompanyFillRequest {
  companyName: string
  hint?:       string
  locale?:     AILocale
}

export interface CompanyFillResponse {
  industry:        string
  size:            CompanySize | null
  location:        string
  description:     string
  website:         string | null
  linkedinUrl:     string | null
  glassdoorRating: number | null
  techStack:       string[]
  disambiguation:  string | null
}

// ---------------------------------------------------------------------------
// CV parse — extract structured highlights from an uploaded resume file
// ---------------------------------------------------------------------------

export interface CVParseRequest {
  fileName:   string
  mimeType:   string
  base64Data: string  // base64 (no data: prefix)
  locale?:    AILocale
}

export interface CVParseResponse {
  emphasis:            string
  skillsHighlighted:   string[]
  projectsHighlighted: string[]
  suggestedName:       string
}

// ---------------------------------------------------------------------------
// JD Summarize — turn a URL or pasted text into a clean bullet summary
// ---------------------------------------------------------------------------

export interface JDSummarizeRequest {
  jdUrl?:  string
  jdText?: string
  locale?: AILocale
}

export interface JDSummarizeResponse {
  headline: string
  bullets:  string[]
  bodyText: string
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

const API_KEY_STORAGE_KEY = 'interviewflow.anthropicApiKey'

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setStoredApiKey(key: string): void {
  try {
    if (key.trim().length === 0) localStorage.removeItem(API_KEY_STORAGE_KEY)
    else localStorage.setItem(API_KEY_STORAGE_KEY, key.trim())
  } catch {
    /* ignore */
  }
}

async function post<TReq, TRes>(path: string, body: TReq): Promise<AIResult<TRes>> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const userKey = getStoredApiKey()
    if (userKey) headers['x-anthropic-key'] = userKey

    const res = await fetch(path, {
      method:  'POST',
      headers,
      body:    JSON.stringify(body),
    })

    const json = await res.json() as AIResult<TRes>

    if (!res.ok) {
      return {
        ok:    false,
        error: (json as { ok: false; error: string }).error ?? `HTTP ${res.status}`,
      }
    }

    return json
  } catch (err) {
    return {
      ok:    false,
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

// ---------------------------------------------------------------------------
// Demo mode — return canned responses when no API key is configured.
// In development we still hit the real backend (uses ANTHROPIC_API_KEY from
// .env), so visitors only get demo when they have no key AND we're deployed.
// ---------------------------------------------------------------------------

export function isDemoMode(): boolean {
  if (getStoredApiKey().length > 0) return false
  // In dev, .env on the server supplies the key — let calls go through.
  if (import.meta.env.DEV) return false
  return true
}

async function demoOk<T>(data: T): Promise<AIResult<T>> {
  const { demoDelay } = await import('@/data/ai-demo-responses')
  await demoDelay()
  return { ok: true, data }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const aiClientService = {
  parseJD: async (req: JDParserRequest) => {
    if (isDemoMode()) {
      const { demoJDParser } = await import('@/data/ai-demo-responses')
      return demoOk<JDParserResponse>(demoJDParser)
    }
    return post<JDParserRequest, JDParserResponse>('/api/ai/jd-parser', req)
  },
  prepPack: async (req: PrepPackRequest) => {
    if (isDemoMode()) {
      const { demoPrepPack } = await import('@/data/ai-demo-responses')
      return demoOk<PrepPackResponse>(demoPrepPack)
    }
    return post<PrepPackRequest, PrepPackResponse>('/api/ai/prep-pack', req)
  },
  followUp: async (req: FollowUpRequest) => {
    if (isDemoMode()) {
      const { demoFollowUp } = await import('@/data/ai-demo-responses')
      return demoOk<FollowUpResponse>(demoFollowUp)
    }
    return post<FollowUpRequest, FollowUpResponse>('/api/ai/follow-up', req)
  },
  fillCompany: async (req: CompanyFillRequest) => {
    if (isDemoMode()) {
      const { demoCompanyFill } = await import('@/data/ai-demo-responses')
      return demoOk<CompanyFillResponse>({ ...demoCompanyFill, description: `${req.companyName} — ${demoCompanyFill.description}` })
    }
    return post<CompanyFillRequest, CompanyFillResponse>('/api/ai/company-fill', req)
  },
  parseCV: async (req: CVParseRequest) => {
    if (isDemoMode()) {
      const { demoCVParse } = await import('@/data/ai-demo-responses')
      return demoOk<CVParseResponse>(demoCVParse)
    }
    return post<CVParseRequest, CVParseResponse>('/api/ai/cv-parse', req)
  },
  summarizeJD: async (req: JDSummarizeRequest) => {
    if (isDemoMode()) {
      const { demoJDSummarize } = await import('@/data/ai-demo-responses')
      return demoOk<JDSummarizeResponse>(demoJDSummarize)
    }
    return post<JDSummarizeRequest, JDSummarizeResponse>('/api/ai/jd-summarize', req)
  },
}
