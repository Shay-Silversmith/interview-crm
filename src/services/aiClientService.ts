// ---------------------------------------------------------------------------
// InterviewFlow — src/services/aiClientService.ts
// Client-side fetch wrappers for the AI serverless functions.
// BYOK: the user's Gemini API key is read from localStorage via aiKey.ts and
// forwarded as the `x-gemini-api-key` header. The key is never logged.
//
// Types here mirror api/ai/_lib/schemas.ts. They are duplicated deliberately so
// src/ never imports from api/ — the two build under different tsconfigs.
// ---------------------------------------------------------------------------

import { aiHeaders, hasStoredGeminiKey } from './aiKey'

export type AILocale = 'en' | 'he'

// ---------------------------------------------------------------------------
// Key-state helpers used by the shell chrome and the legacy agent service.
//
// "Demo mode" now means exactly one thing: no Gemini key is configured. It used
// to also swap in canned responses, which is why a fabricated company profile
// could reach the screen looking like research. Nothing is substituted any
// more — the tools report what went wrong instead.
// ---------------------------------------------------------------------------

export function isDemoMode(): boolean {
  return !hasStoredGeminiKey()
}

/** Legacy Claude-era key slot, still read by the experimental agent service. */
const LEGACY_API_KEY_STORAGE_KEY = 'interviewflow.anthropicApiKey'

export function getStoredApiKey(): string {
  try { return localStorage.getItem(LEGACY_API_KEY_STORAGE_KEY) ?? '' }
  catch { return '' }
}

export function setStoredApiKey(key: string): void {
  try {
    if (key.trim().length === 0) localStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY)
    else localStorage.setItem(LEGACY_API_KEY_STORAGE_KEY, key.trim())
  } catch { /* ignore */ }
}

export type AIResult<T> =
  | { ok: true;  data: T; sources?: GroundingSource[] }
  | { ok: false; error: string }

export interface GroundingSource {
  title?: string
  uri?:   string
}

/** The shared "who is this candidate" block. Built by useCandidate(). */
export interface CandidatePayload {
  name?:        string
  headline?:    string
  background?:  string
  skills?:      string[]
  targetRoles?: string[]
  cv?: {
    emphasis:            string
    skillsHighlighted:   string[]
    projectsHighlighted: string[]
  } | null
}

// ---------------------------------------------------------------------------
// JD Parser / role analysis
// ---------------------------------------------------------------------------

export type FitLevel = 'strong' | 'partial' | 'gap'

export interface FitItem {
  requirement: string
  level:       FitLevel
  evidence:    string
}

export interface JDParserRequest {
  jdText?:         string
  jdUrl?:          string
  roleTitle?:      string
  companyName?:    string
  userBackground?: string
  candidate?:      CandidatePayload
  locale?:         AILocale
}

export interface JDParserResponse {
  roleSummary:       string
  seniority:         string
  responsibilities:  string[]
  requirements:      string[]
  niceToHaves:       string[]
  technologies:      string[]
  whatTheyWant:      string
  fitAnalysis:       FitItem[]
  howIMatch:         string[]
  gapsToAddress:     string[]
  whatToEmphasize:   string[]
  possibleQuestions: string[]
  prepChecklist:     string[]
  sourceNote?:       string | null
}

// ---------------------------------------------------------------------------
// Prep pack
// ---------------------------------------------------------------------------

export interface StarStory {
  title?:    string
  situation: string
  task:      string
  action:    string
  result:    string
}

export interface PrepPackRequest {
  application: {
    title:          string
    company:        string
    stage:          string
    jdText?:        string
    jdUrl?:         string
    aiRoleSummary?: string
    notes?:         string
  }
  cv: {
    emphasis:            string
    skillsHighlighted:   string[]
    projectsHighlighted: string[]
  } | null
  company: {
    name:                string
    summary?:            string
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
  research?:      boolean
  locale?:        AILocale
}

export interface PrepPackResponse {
  companySnapshot:            string
  roleSummary:                string
  reviewFromCV:               string[]
  expectedHRQuestions:        string[]
  expectedTechnicalQuestions: string[]
  recommendedStarStories:     StarStory[]
  questionsToAsk:             string[]
  finalChecklist:             string[]
  dayOfPlan:                  string[]
  redFlagsToProbe:            string[]
}

// ---------------------------------------------------------------------------
// Follow-up
// ---------------------------------------------------------------------------

export type MessageType = 'post-interview' | 'ping-after-silence' | 'thank-you' | 'decline-politely'
export type Tone        = 'professional' | 'warm' | 'casual'

export interface FollowUpRequest {
  messageType:   MessageType
  company:       string
  contactName:   string
  contactTitle?: string
  role:          string
  tone:          Tone
  context:       string
  candidate?:    CandidatePayload
  locale?:       AILocale
}

export interface FollowUpResponse {
  short:    string
  warm:     string
  linkedIn: string
  subject:  string
}

// ---------------------------------------------------------------------------
// Company auto-fill (CRM columns)
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
// Company brief (the interview research report)
// ---------------------------------------------------------------------------

export interface CompanyBriefRequest {
  companyName: string
  roleTitle?:  string
  hint?:       string
  urls?:       string[]
  candidate?:  CandidatePayload
  locale?:     AILocale
}

export interface NewsItem {
  date:         string
  item:         string
  whyItMatters: string
}

export interface CompanyBriefResponse {
  headline:         string
  whatTheyDo:       string
  products:         string[]
  businessModel:    string
  customers:        string
  scale:            string
  recentNews:       NewsItem[]
  competitors:      string[]
  culture:          string[]
  interviewProcess: string[]
  localPresence:    string | null
  techStack:        string[]
  talkingPoints:    string[]
  questionsToAsk:   string[]
  watchOuts:        string[]
  whyYouFit:        string[]
  disambiguation:   string | null
}

// ---------------------------------------------------------------------------
// Interview debrief
// ---------------------------------------------------------------------------

export interface InterviewDebriefRequest {
  notes:          string
  company?:       string
  role?:          string
  interviewType?: string
  interviewer?:   string
  interviewedAt?: string
  candidate?:     CandidatePayload
  locale?:        AILocale
}

export interface DebriefQuestion {
  question:    string
  answerGiven: string
  assessment:  string
}

export interface InterviewDebriefResponse {
  headline:            string
  overview:            string
  questionsAsked:      DebriefQuestion[]
  topicsCovered:       string[]
  learnedAboutRole:    string[]
  wentWell:            string[]
  couldImprove:        string[]
  unansweredQuestions: string[]
  signalsRead:         string[]
  nextSteps:           string[]
  followUpActions:     string[]
  prepForNextRound:    string[]
  markdown:            string
}

// ---------------------------------------------------------------------------
// STAR answers
// ---------------------------------------------------------------------------

export interface StarAnswersRequest {
  role:       string
  company:    string
  jdText?:    string
  jdUrl?:     string
  question?:  string
  focus?:     string
  count?:     number
  candidate?: CandidatePayload
  locale?:    AILocale
}

export interface StarAnswer {
  question:     string
  whyAsked:     string
  basedOn:      string
  situation:    string
  task:         string
  action:       string
  result:       string
  spokenAnswer: string
  deliveryTips: string[]
  followUps:    string[]
}

export interface StarAnswersResponse {
  answers:       StarAnswer[]
  coverageNote?: string | null
}

// ---------------------------------------------------------------------------
// CV parse
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
  extractedText:       string
}

// ---------------------------------------------------------------------------
// JD summarize
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
// Transport
// ---------------------------------------------------------------------------

/**
 * Timeouts are per tool, because the tools are not comparable. Drafting a
 * follow-up is one short generation; researching a company runs several search
 * round-trips before the model writes anything. A single ceiling either cuts
 * the research off mid-flight or lets a hung quick call sit there for minutes.
 *
 * Note the server side has its own ceiling: vercel.json caps functions at 60s,
 * so in production a request dies there long before these do. These values only
 * bound the wait in local development and against a longer-running host.
 */
const TIMEOUT_QUICK_MS    = 90_000
const TIMEOUT_RESEARCH_MS = 240_000

async function post<TReq, TRes>(
  path: string,
  body: TReq,
  timeoutMs: number = TIMEOUT_QUICK_MS,
): Promise<AIResult<TRes>> {
  let headers: HeadersInit
  try {
    headers = aiHeaders()
  } catch {
    return {
      ok:    false,
      error: 'NO_API_KEY',
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(path, {
      method: 'POST',
      headers,
      body:   JSON.stringify(body),
      signal: controller.signal,
    })

    // A host that kills a long function answers with its own error page, not
    // ours. Vercel caps functions at 60s on Hobby, and a research call that
    // runs past it arrives here as a 504 full of HTML — which read as a
    // generic server fault until it was named.
    if (res.status === 504 || res.status === 502) {
      return {
        ok: false,
        error:
          `The server cut the request off after about a minute (HTTP ${res.status}). ` +
          'Deployed functions have a hard time limit that research-backed tools can exceed. ' +
          'Running locally has no such limit.',
      }
    }

    // A dev server without the API middleware answers /api/* with index.html.
    // Parsing that as JSON throws "Unexpected token '<'", which is where the
    // "nothing works locally" reports came from — say what actually happened.
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      const preview = (await res.text()).slice(0, 200)
      return {
        ok: false,
        error:
          `The AI endpoint ${path} did not return JSON (HTTP ${res.status}). ` +
          `This usually means the API functions are not running. Response began: ${preview}`,
      }
    }

    const json = await res.json() as AIResult<TRes>
    if (!res.ok) {
      return {
        ok:    false,
        error: (json as { ok: false; error?: string }).error ?? `HTTP ${res.status}`,
      }
    }
    return json
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        ok:    false,
        error: `The AI request timed out after ${Math.round(timeoutMs / 1000)} seconds. Try again, or shorten the input.`,
      }
    }
    return {
      ok:    false,
      error: err instanceof Error ? err.message : 'Network error',
    }
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const aiClientService = {
  // Research-backed: these search the web before writing.
  companyBrief:   (req: CompanyBriefRequest) =>
    post<CompanyBriefRequest, CompanyBriefResponse>('/api/ai/company-brief', req, TIMEOUT_RESEARCH_MS),

  prepPack:       (req: PrepPackRequest) =>
    post<PrepPackRequest, PrepPackResponse>('/api/ai/prep-pack', req, TIMEOUT_RESEARCH_MS),

  fillCompany:    (req: CompanyFillRequest) =>
    post<CompanyFillRequest, CompanyFillResponse>('/api/ai/company-fill', req, TIMEOUT_RESEARCH_MS),

  // Reads a URL when given one, so it can also be slow.
  parseJD:        (req: JDParserRequest) =>
    post<JDParserRequest, JDParserResponse>(
      '/api/ai/jd-parser', req, req.jdUrl ? TIMEOUT_RESEARCH_MS : TIMEOUT_QUICK_MS),

  starAnswers:    (req: StarAnswersRequest) =>
    post<StarAnswersRequest, StarAnswersResponse>(
      '/api/ai/star-answers', req, req.jdUrl && !req.jdText ? TIMEOUT_RESEARCH_MS : TIMEOUT_QUICK_MS),

  summarizeJD:    (req: JDSummarizeRequest) =>
    post<JDSummarizeRequest, JDSummarizeResponse>(
      '/api/ai/jd-summarize', req, req.jdText ? TIMEOUT_QUICK_MS : TIMEOUT_RESEARCH_MS),

  // Single-generation tools.
  followUp:       (req: FollowUpRequest) =>
    post<FollowUpRequest, FollowUpResponse>('/api/ai/follow-up', req),

  interviewDebrief: (req: InterviewDebriefRequest) =>
    post<InterviewDebriefRequest, InterviewDebriefResponse>('/api/ai/interview-debrief', req),

  parseCV:        (req: CVParseRequest) =>
    post<CVParseRequest, CVParseResponse>('/api/ai/cv-parse', req),
}
