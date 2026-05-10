// ---------------------------------------------------------------------------
// InterviewFlow — aiService.ts
// Unified AI service. Mock CRUD for legacy tools + three live AI generators.
// The generators call /api/ai/* serverless functions when VITE_AI_ENABLED=true;
// otherwise (or on any failure) they return mock fallback data.
// ---------------------------------------------------------------------------
import type { AISummary } from '@/types'
import type { AIToolType } from '@/lib/enums'
import { mockAISummaries } from '@/data/mock-ai'
import {
  mockJDParserResponse,
  mockPrepPackResponse,
  getMockFollowUpResponse,
} from '@/data/mock-ai-responses'
import { MOCK_DELAY_MS } from '@/lib/constants'
import { isSupabaseMode, isAIEnabled } from '@/lib/env'
import { getSupabaseClient } from '@/lib/supabase'
import { mapAISummary } from '@/lib/mappers'
import {
  aiClientService,
  type JDParserRequest,
  type JDParserResponse,
  type PrepPackRequest,
  type PrepPackResponse,
  type FollowUpRequest,
  type FollowUpResponse,
  type AILocale,
} from '@/services/aiClientService'
import { mockStore } from '@/data/mock-store'

const delay = (extraMs = 0) =>
  new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + extraMs + Math.random() * 100))

// ---------------------------------------------------------------------------
// Typed result for the three live generators
// "fromFallback" lets the component surface the right toast without coupling
// the service to React's toast context.
// ---------------------------------------------------------------------------
export type FallbackReason = 'disabled' | 'rate-limited' | 'network-error' | 'validation-error'

export interface AIGeneratorResult<T> {
  data: T
  fromFallback: boolean
  fallbackReason?: FallbackReason
}

function classifyError(errorMsg: string): FallbackReason {
  const msg = errorMsg.toLowerCase()
  if (msg.includes('429') || msg.includes('rate limit')) return 'rate-limited'
  if (msg.includes('unexpected') || msg.includes('validation') || msg.includes('parse'))
    return 'validation-error'
  return 'network-error'
}

// ---------------------------------------------------------------------------
// Mock CRUD implementation
// ---------------------------------------------------------------------------
const mockCRUD = {
  async list(): Promise<AISummary[]> {
    await delay()
    return [...mockAISummaries, ...mockStore.ai.list().filter(s => !mockAISummaries.find(m => m.id === s.id))]
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
      .eq('entity_type', 'application')
      .eq('entity_id', applicationId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapAISummary)
  },

  async create(data: Partial<AISummary>): Promise<AISummary> {
    const sb = getSupabaseClient()
    const { data: inserted, error } = await sb
      .from('ai_summaries')
      .insert({
        tool_type:   data.toolType ?? 'Prepare Me',
        entity_type: data.applicationId ? 'application' : 'general',
        entity_id:   data.applicationId ?? null,
        input_data:  data.inputData ?? {},
        output_data: data.outputData ?? {},
        is_mocked:   data.isMocked ?? false,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mapAISummary(inserted)
  },
}

const crudImpl = isSupabaseMode() ? supabaseCRUD : mockCRUD

// ---------------------------------------------------------------------------
// Live AI generators — callable regardless of mock/Supabase mode
// ---------------------------------------------------------------------------

async function parseJD(
  req: JDParserRequest
): Promise<AIGeneratorResult<JDParserResponse>> {
  if (!isAIEnabled()) {
    await delay(600)
    return { data: mockJDParserResponse, fromFallback: true, fallbackReason: 'disabled' }
  }
  try {
    const res = await aiClientService.parseJD(req)
    if (res.ok) return { data: res.data, fromFallback: false }
    return {
      data: mockJDParserResponse,
      fromFallback: true,
      fallbackReason: classifyError(res.error),
    }
  } catch (err) {
    return {
      data: mockJDParserResponse,
      fromFallback: true,
      fallbackReason: 'network-error',
    }
  }
}

async function generatePrepPack(
  req: PrepPackRequest,
  locale?: AILocale,
): Promise<AIGeneratorResult<PrepPackResponse>> {
  if (!isAIEnabled()) {
    await delay(800)
    return { data: mockPrepPackResponse, fromFallback: true, fallbackReason: 'disabled' }
  }
  try {
    const res = await aiClientService.prepPack({ ...req, locale })
    if (res.ok) return { data: res.data, fromFallback: false }
    return {
      data: mockPrepPackResponse,
      fromFallback: true,
      fallbackReason: classifyError(res.error),
    }
  } catch (err) {
    return {
      data: mockPrepPackResponse,
      fromFallback: true,
      fallbackReason: 'network-error',
    }
  }
}

async function generateFollowUps(
  req: FollowUpRequest,
  locale?: AILocale,
): Promise<AIGeneratorResult<FollowUpResponse>> {
  if (!isAIEnabled()) {
    await delay(500)
    return {
      data: getMockFollowUpResponse(req.company, req.contactName),
      fromFallback: true,
      fallbackReason: 'disabled',
    }
  }
  try {
    const res = await aiClientService.followUp({ ...req, locale })
    if (res.ok) return { data: res.data, fromFallback: false }
    return {
      data: getMockFollowUpResponse(req.company, req.contactName),
      fromFallback: true,
      fallbackReason: classifyError(res.error),
    }
  } catch (err) {
    return {
      data: getMockFollowUpResponse(req.company, req.contactName),
      fromFallback: true,
      fallbackReason: 'network-error',
    }
  }
}

/**
 * Persists a Prep Pack result as an AISummary row linked to an application.
 * Called by PrepPackPanel after the user reviews and edits the draft.
 */
async function savePrepPack(
  applicationId: string,
  data: PrepPackResponse
): Promise<AISummary> {
  // Convert PrepPackResponse to outputData (flatten StarStory[] to JSON string)
  const outputData: Record<string, string> = {}
  for (const [k, v] of Object.entries(data)) {
    outputData[k] = typeof v === 'string' ? v : JSON.stringify(v)
  }
  return crudImpl.create({
    toolType:      'Prepare Me',
    applicationId,
    inputData:     {},
    outputData,
    isMocked:      !isAIEnabled(),
  })
}

// ---------------------------------------------------------------------------
// Exported service
// ---------------------------------------------------------------------------
export const aiService = {
  // CRUD (legacy mocked tools)
  list:             crudImpl.list.bind(crudImpl),
  getById:          crudImpl.getById.bind(crudImpl),
  getByToolType:    crudImpl.getByToolType.bind(crudImpl),
  getByApplication: crudImpl.getByApplication.bind(crudImpl),

  // Live AI generators
  parseJD,
  generatePrepPack,
  generateFollowUps,
  savePrepPack,
}
