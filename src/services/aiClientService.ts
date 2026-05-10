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
// Fetch helpers
// ---------------------------------------------------------------------------

async function post<TReq, TRes>(path: string, body: TReq): Promise<AIResult<TRes>> {
  try {
    const res = await fetch(path, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
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
// Public API
// ---------------------------------------------------------------------------

export const aiClientService = {
  parseJD:     (req: JDParserRequest)  => post<JDParserRequest,  JDParserResponse>('/api/ai/jd-parser', req),
  prepPack:    (req: PrepPackRequest)  => post<PrepPackRequest,  PrepPackResponse>('/api/ai/prep-pack',  req),
  followUp:    (req: FollowUpRequest)  => post<FollowUpRequest,  FollowUpResponse>('/api/ai/follow-up', req),
}
