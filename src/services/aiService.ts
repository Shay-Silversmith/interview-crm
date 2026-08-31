// ---------------------------------------------------------------------------
// InterviewFlow — aiService.ts
// Mock/Supabase CRUD for saved AI summaries, plus the live AI generators.
//
// The generators no longer substitute canned data when a call fails. They used
// to, and the result was that a failed request produced a confident-looking
// company profile or prep pack that read exactly like a real one — content that
// could then be saved onto an application as fact. A failure now returns the
// reason it failed, and the panels say so.
// ---------------------------------------------------------------------------
import type { AISummary } from '@/types'
import type { AIToolType } from '@/lib/enums'
import { mockAISummaries } from '@/data/mock-ai'
import { MOCK_DELAY_MS } from '@/lib/constants'
import { isSupabaseMode, isAIEnabled } from '@/lib/env'
import { getSupabaseClient } from '@/lib/supabase'
import { mapAISummary } from '@/lib/mappers'
import { hasStoredGeminiKey } from '@/services/aiKey'
import { getCurrentUserId } from '@/lib/currentUser'
import {
  aiClientService,
  type AIResult,
  type GroundingSource,
  type JDParserRequest,
  type JDParserResponse,
  type PrepPackRequest,
  type PrepResearchResponse,
  type PrepPlanResponse,
  type FollowUpRequest,
  type FollowUpResponse,
  type CompanyFillRequest,
  type CompanyFillResponse,
  type CompanyBriefRequest,
  type CompanyProfileResponse,
  type CompanyInterviewResponse,
  type InterviewDebriefRequest,
  type InterviewDebriefResponse,
  type StarAnswersRequest,
  type StarAnswersResponse,
  type CVParseRequest,
  type CVParseResponse,
  type JDSummarizeRequest,
  type JDSummarizeResponse,
} from '@/services/aiClientService'
import { mockStore } from '@/data/mock-store'

const delay = (extraMs = 0) =>
  new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + extraMs + Math.random() * 100))

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type FailureReason =
  | 'no-key'
  | 'disabled'
  | 'rate-limited'
  | 'timeout'
  | 'offline'
  | 'server'
  | 'quota'

export type AIRun<T> =
  | { ok: true;  data: T; sources?: GroundingSource[] }
  | { ok: false; reason: FailureReason; message: string }

function classify(errorMsg: string): FailureReason {
  const msg = errorMsg.toLowerCase()
  if (msg.includes('no_api_key'))                          return 'no-key'
  if (msg.includes('api key'))                             return 'no-key'
  if (msg.includes('quota'))                               return 'quota'
  if (msg.includes('429') || msg.includes('rate limit'))   return 'rate-limited'
  if (msg.includes('timed out') || msg.includes('timeout')) return 'timeout'
  if (msg.includes('could not reach') || msg.includes('network') || msg.includes('failed to fetch'))
    return 'offline'
  return 'server'
}

/**
 * Runs one AI call and normalises everything that can go wrong into a reason
 * the UI can act on. The two pre-flight checks matter: without them a missing
 * key looks identical to a server fault, which sent people debugging their
 * network instead of opening Settings.
 */
async function run<T>(call: () => Promise<AIResult<T>>): Promise<AIRun<T>> {
  if (!isAIEnabled()) {
    return {
      ok:      false,
      reason:  'disabled',
      message: 'Live AI is switched off for this build (VITE_AI_ENABLED is not "true").',
    }
  }
  if (!hasStoredGeminiKey()) {
    return {
      ok:      false,
      reason:  'no-key',
      message: 'No Gemini API key is set. Add one in Settings to use the AI tools.',
    }
  }

  try {
    const res = await call()
    if (res.ok) return { ok: true, data: res.data, sources: res.sources }
    return { ok: false, reason: classify(res.error), message: res.error }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return { ok: false, reason: classify(message), message }
  }
}

// ---------------------------------------------------------------------------
// Mock CRUD implementation
// ---------------------------------------------------------------------------
const mockCRUD = {
  async list(): Promise<AISummary[]> {
    await delay()
    return [
      ...mockAISummaries,
      ...mockStore.ai.list().filter(s => !mockAISummaries.find(m => m.id === s.id)),
    ]
  },

  async getById(id: string): Promise<AISummary | null> {
    await delay()
    return mockStore.ai.getById(id) ?? mockAISummaries.find(s => s.id === id) ?? null
  },

  async getByToolType(toolType: AIToolType): Promise<AISummary[]> {
    await delay()
    return [...mockAISummaries, ...mockStore.ai.list()].filter(s => s.toolType === toolType)
  },

  async getByApplication(applicationId: string): Promise<AISummary[]> {
    await delay()
    const all = [...mockAISummaries, ...mockStore.ai.list()]
    const seen = new Set<string>()
    return all
      .filter(s => s.applicationId === applicationId)
      .filter(s => (seen.has(s.id) ? false : seen.add(s.id) || true))
  },

  async create(data: Partial<AISummary>): Promise<AISummary> {
    await delay()
    return mockStore.ai.create(data)
  },
}

// ---------------------------------------------------------------------------
// Supabase CRUD implementation
// ---------------------------------------------------------------------------
const supabaseCRUD = {
  async list(): Promise<AISummary[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('ai_summaries')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapAISummary)
  },

  async getById(id: string): Promise<AISummary | null> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('ai_summaries').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data ? mapAISummary(data) : null
  },

  async getByToolType(toolType: AIToolType): Promise<AISummary[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('ai_summaries')
      .select('*')
      .eq('tool_type', toolType)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapAISummary)
  },

  async getByApplication(applicationId: string): Promise<AISummary[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb
      .from('ai_summaries')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapAISummary)
  },

  async create(data: Partial<AISummary>): Promise<AISummary> {
    const sb = getSupabaseClient()

    // ai_summaries.user_id is NOT NULL with no default and no trigger, and the
    // RLS policy checks auth.uid() = user_id, so an insert that omits it fails
    // twice over. Nothing set it, which is why the table was still empty after
    // every Save button in the AI tools had been pressed.
    const userId = getCurrentUserId() ?? (await sb.auth.getUser()).data.user?.id
    if (!userId) {
      throw new Error('You are signed out, so there is nothing to save to. Sign in and try again.')
    }

    const { data: inserted, error } = await sb
      .from('ai_summaries')
      .insert({
        user_id:        userId,
        tool_type:      data.toolType ?? 'Prepare Me',
        application_id: data.applicationId ?? null,
        company_id:     data.companyId ?? null,
        input_data:     data.inputData ?? {},
        output_data:    data.outputData ?? {},
        is_mocked:      data.isMocked ?? false,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mapAISummary(inserted)
  },
}

const crudImpl = isSupabaseMode() ? supabaseCRUD : mockCRUD

// ---------------------------------------------------------------------------
// Company briefing — two halves, in parallel
//
// Split because a deployed function gets about 60 seconds and one grounded call
// that searches the web and then writes the whole brief does not reliably fit.
// Two requests are two invocations, each with its own clock, and running them
// together means the wait is the slower half rather than the sum.
//
// Either half failing is not fatal. Losing the hiring-loop section is a worse
// brief; losing the whole brief the night before an interview is a worse
// evening. Whatever came back gets rendered, with the gap named.
// ---------------------------------------------------------------------------

export interface CompanyBrief {
  profile:   CompanyProfileResponse | null
  interview: CompanyInterviewResponse | null
  /** Names the half that failed, when exactly one did. */
  partial?:  { half: 'profile' | 'interview'; message: string }
}

async function researchCompany(req: CompanyBriefRequest): Promise<AIRun<CompanyBrief>> {
  const [profileRun, interviewRun] = await Promise.all([
    run(() => aiClientService.companyProfile(req)),
    run(() => aiClientService.companyInterview(req)),
  ])

  // Both down means the cause is shared — no key, AI off, no connection — so
  // report that cause rather than inventing a combined one.
  if (!profileRun.ok && !interviewRun.ok) {
    return profileRun
  }

  const sources = [
    ...(profileRun.ok   ? profileRun.sources   ?? [] : []),
    ...(interviewRun.ok ? interviewRun.sources ?? [] : []),
  ]
  const seen = new Set<string>()
  const merged = sources.filter(s => {
    if (!s.uri || seen.has(s.uri)) return false
    seen.add(s.uri)
    return true
  })

  return {
    ok:   true,
    data: {
      profile:   profileRun.ok   ? profileRun.data   : null,
      interview: interviewRun.ok ? interviewRun.data : null,
      partial:
        !profileRun.ok   ? { half: 'profile',   message: profileRun.message } :
        !interviewRun.ok ? { half: 'interview', message: interviewRun.message } :
        undefined,
    },
    sources: merged,
  }
}

// ---------------------------------------------------------------------------
// Prep pack — two halves, in parallel, for the same reason as the briefing.
//
// The seam here is natural: one half needs the live web, the other needs only
// the CV and job description already in the request. The second returns in
// seconds no matter how the research half fares, so a slow or failed search
// no longer costs the candidate their STAR stories and checklist.
// ---------------------------------------------------------------------------

export interface PrepPack {
  research: PrepResearchResponse | null
  plan:     PrepPlanResponse | null
  partial?: { half: 'research' | 'plan'; message: string }
}

async function buildPrepPack(req: PrepPackRequest): Promise<AIRun<PrepPack>> {
  const [researchRun, planRun] = await Promise.all([
    run(() => aiClientService.prepResearch(req)),
    run(() => aiClientService.prepPlan(req)),
  ])

  if (!researchRun.ok && !planRun.ok) return researchRun

  return {
    ok:   true,
    data: {
      research: researchRun.ok ? researchRun.data : null,
      plan:     planRun.ok     ? planRun.data     : null,
      partial:
        !researchRun.ok ? { half: 'research', message: researchRun.message } :
        !planRun.ok     ? { half: 'plan',     message: planRun.message } :
        undefined,
    },
    sources: researchRun.ok ? researchRun.sources : undefined,
  }
}

// ---------------------------------------------------------------------------
// Saving generated output
// ---------------------------------------------------------------------------

/** Flattens any generator payload into the string map an AISummary stores. */
function toOutputData(data: object): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(data)) {
    out[k] = typeof v === 'string' ? v : JSON.stringify(v)
  }
  return out
}

async function saveSummary(
  toolType: AIToolType,
  data: object,
  links: { applicationId?: string; companyId?: string; inputData?: Record<string, string> } = {},
): Promise<AISummary> {
  return crudImpl.create({
    toolType,
    applicationId: links.applicationId,
    companyId:     links.companyId,
    inputData:     links.inputData ?? {},
    outputData:    toOutputData(data),
    isMocked:      false,
  })
}

// ---------------------------------------------------------------------------
// Exported service
// ---------------------------------------------------------------------------
export const aiService = {
  // CRUD
  list:             crudImpl.list.bind(crudImpl),
  getById:          crudImpl.getById.bind(crudImpl),
  getByToolType:    crudImpl.getByToolType.bind(crudImpl),
  getByApplication: crudImpl.getByApplication.bind(crudImpl),

  // Generators
  parseJD:  (req: JDParserRequest): Promise<AIRun<JDParserResponse>> =>
    run(() => aiClientService.parseJD(req)),

  generatePrepPack: buildPrepPack,

  generateFollowUps: (req: FollowUpRequest): Promise<AIRun<FollowUpResponse>> =>
    run(() => aiClientService.followUp(req)),

  fillCompany: (req: CompanyFillRequest): Promise<AIRun<CompanyFillResponse>> =>
    run(() => aiClientService.fillCompany(req)),

  companyBrief: researchCompany,

  interviewDebrief: (req: InterviewDebriefRequest): Promise<AIRun<InterviewDebriefResponse>> =>
    run(() => aiClientService.interviewDebrief(req)),

  starAnswers: (req: StarAnswersRequest): Promise<AIRun<StarAnswersResponse>> =>
    run(() => aiClientService.starAnswers(req)),

  parseCV: (req: CVParseRequest): Promise<AIRun<CVParseResponse>> =>
    run(() => aiClientService.parseCV(req)),

  summarizeJD: (req: JDSummarizeRequest): Promise<AIRun<JDSummarizeResponse>> =>
    run(() => aiClientService.summarizeJD(req)),

  // Persistence
  saveSummary,
  savePrepPack: (applicationId: string, data: object) =>
    saveSummary('Prepare Me', data, { applicationId }),
}
