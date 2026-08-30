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
import {
  aiClientService,
  type AIResult,
  type GroundingSource,
  type JDParserRequest,
  type JDParserResponse,
  type PrepPackRequest,
  type PrepPackResponse,
  type FollowUpRequest,
  type FollowUpResponse,
  type CompanyFillRequest,
  type CompanyFillResponse,
  type CompanyBriefRequest,
  type CompanyBriefResponse,
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
    const { data: inserted, error } = await sb
      .from('ai_summaries')
      .insert({
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

  generatePrepPack: (req: PrepPackRequest): Promise<AIRun<PrepPackResponse>> =>
    run(() => aiClientService.prepPack(req)),

  generateFollowUps: (req: FollowUpRequest): Promise<AIRun<FollowUpResponse>> =>
    run(() => aiClientService.followUp(req)),

  fillCompany: (req: CompanyFillRequest): Promise<AIRun<CompanyFillResponse>> =>
    run(() => aiClientService.fillCompany(req)),

  companyBrief: (req: CompanyBriefRequest): Promise<AIRun<CompanyBriefResponse>> =>
    run(() => aiClientService.companyBrief(req)),

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
  savePrepPack: (applicationId: string, data: PrepPackResponse) =>
    saveSummary('Prepare Me', data, { applicationId }),
}
