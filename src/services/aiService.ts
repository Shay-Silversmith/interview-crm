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
  type CompanyFillRequest,
  type CompanyFillResponse,
  type CVParseRequest,
  type CVParseResponse,
  type JDSummarizeRequest,
  type JDSummarizeResponse,
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
export type FallbackReason = 'disabled' | 'no-key' | 'rate-limited' | 'network-error' | 'validation-error'

export interface AIGeneratorResult<T> {
  data: T
  fromFallback: boolean
  fallbackReason?: FallbackReason
}

function classifyError(errorMsg: string): FallbackReason {
  const msg = errorMsg.toLowerCase()
  // A missing key is a setup step, not a network problem — classifying it as
  // one sent users chasing connectivity instead of opening Settings.
  if (msg.includes('no_api_key') || msg.includes('api key')) return 'no-key'
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

// ---------------------------------------------------------------------------
// Mock generators for the new tools — used when AI is disabled or the live
// endpoint fails. Designed to be "useful enough" so the user can preview the
// UX without a real AI backend running.
// ---------------------------------------------------------------------------

const KNOWN_COMPANIES: Record<string, Partial<CompanyFillResponse>> = {
  amazon: {
    industry: 'E-commerce · Cloud',
    size: '10000+',
    location: 'Seattle, WA · Tel Aviv',
    description: 'One of the largest tech companies in the world, operating retail, AWS, devices, advertising, entertainment, and logistics. Known for high engineering bar and a write-things-down culture.',
    website: 'https://www.amazon.com',
    linkedinUrl: 'https://linkedin.com/company/amazon',
    glassdoorRating: 3.8,
    techStack: ['Java', 'AWS', 'Python', 'Go', 'TypeScript', 'React'],
  },
  myheritage: {
    industry: 'Genealogy · Consumer SaaS',
    size: '501-2000',
    location: 'Or Yehuda, Israel',
    description: 'Online genealogy platform offering family-tree building, historical record search, and DNA testing. Israeli company with a global user base.',
    website: 'https://www.myheritage.com',
    linkedinUrl: 'https://linkedin.com/company/myheritage',
    glassdoorRating: 4.1,
    techStack: ['PHP', 'Python', 'MySQL', 'Redis', 'AWS', 'React'],
  },
  mobileye: {
    industry: 'Autonomous Driving · Computer Vision',
    size: '2001-10000',
    location: 'Jerusalem, Israel',
    description: 'Develops vision-based ADAS and autonomous-driving technologies. Spun off from Intel and listed on NASDAQ.',
    website: 'https://www.mobileye.com',
    linkedinUrl: 'https://linkedin.com/company/mobileye',
    glassdoorRating: 4.0,
    techStack: ['C++', 'Python', 'CUDA', 'TensorFlow', 'PyTorch'],
  },
  wix: {
    industry: 'Website Builder · SaaS',
    size: '2001-10000',
    location: 'Tel Aviv, Israel',
    description: 'Cloud-based website-building platform offering drag-and-drop tools, e-commerce, and a developer ecosystem. Israeli, NASDAQ-listed.',
    website: 'https://www.wix.com',
    linkedinUrl: 'https://linkedin.com/company/wix-com',
    glassdoorRating: 4.0,
    techStack: ['Node.js', 'Scala', 'React', 'TypeScript', 'GCP', 'Kafka'],
  },
  upwind: {
    industry: 'Cybersecurity · Cloud Security',
    size: '51-200',
    location: 'Tel Aviv, Israel',
    description: 'Runtime-powered cloud security platform that protects cloud workloads at runtime, with shift-left and shift-right capabilities.',
    website: 'https://www.upwind.io',
    linkedinUrl: 'https://linkedin.com/company/upwind-security',
    glassdoorRating: 4.5,
    techStack: ['Go', 'Kubernetes', 'eBPF', 'AWS', 'GCP', 'TypeScript'],
  },
  salesforce: {
    industry: 'CRM · Enterprise SaaS',
    size: '10000+',
    location: 'San Francisco, CA',
    description: 'World\'s largest CRM platform — sales, service, marketing, commerce, and analytics clouds. Owns Slack and Tableau.',
    website: 'https://www.salesforce.com',
    linkedinUrl: 'https://linkedin.com/company/salesforce',
    glassdoorRating: 4.2,
    techStack: ['Apex', 'Java', 'Lightning Web Components', 'AWS', 'JavaScript'],
  },
}

function mockCompanyFill(companyName: string): CompanyFillResponse {
  const key = companyName.toLowerCase().replace(/\s+/g, '')
  const known = KNOWN_COMPANIES[key]
  if (known) {
    return {
      industry:        known.industry        ?? 'Technology',
      size:            known.size            ?? null,
      location:        known.location        ?? '',
      description:     known.description     ?? '',
      website:         known.website         ?? null,
      linkedinUrl:     known.linkedinUrl     ?? null,
      glassdoorRating: known.glassdoorRating ?? null,
      techStack:       known.techStack       ?? [],
      disambiguation:  null,
    }
  }
  return {
    industry:        'Technology',
    size:            null,
    location:        '',
    description:     `(Demo data) ${companyName} — enable live AI for real research.`,
    website:         null,
    linkedinUrl:     null,
    glassdoorRating: null,
    techStack:       [],
    disambiguation:  null,
  }
}

function mockCVParse(fileName: string): CVParseResponse {
  const baseName = fileName.replace(/\.[^.]+$/, '').slice(0, 28)
  return {
    emphasis:            '(Demo) Generalist tech CV — enable live AI for real extraction.',
    skillsHighlighted:   ['Python', 'SQL', 'TypeScript', 'React'],
    projectsHighlighted: ['Sample project 1', 'Sample project 2'],
    suggestedName:       baseName || 'CV draft',
  }
}

async function fillCompany(
  req: CompanyFillRequest
): Promise<AIGeneratorResult<CompanyFillResponse>> {
  if (!isAIEnabled()) {
    await delay(700)
    return { data: mockCompanyFill(req.companyName), fromFallback: true, fallbackReason: 'disabled' }
  }
  try {
    const res = await aiClientService.fillCompany(req)
    if (res.ok) return { data: res.data, fromFallback: false }
    return {
      data: mockCompanyFill(req.companyName),
      fromFallback: true,
      fallbackReason: classifyError(res.error),
    }
  } catch {
    return {
      data: mockCompanyFill(req.companyName),
      fromFallback: true,
      fallbackReason: 'network-error',
    }
  }
}

async function parseCV(
  req: CVParseRequest
): Promise<AIGeneratorResult<CVParseResponse>> {
  if (!isAIEnabled()) {
    await delay(700)
    return { data: mockCVParse(req.fileName), fromFallback: true, fallbackReason: 'disabled' }
  }
  try {
    const res = await aiClientService.parseCV(req)
    if (res.ok) return { data: res.data, fromFallback: false }
    return {
      data: mockCVParse(req.fileName),
      fromFallback: true,
      fallbackReason: classifyError(res.error),
    }
  } catch {
    return {
      data: mockCVParse(req.fileName),
      fromFallback: true,
      fallbackReason: 'network-error',
    }
  }
}

// ---------------------------------------------------------------------------
// JD Summarize — clean bullet summary from a URL or pasted text
// ---------------------------------------------------------------------------

function mockJDSummarize(req: JDSummarizeRequest): JDSummarizeResponse {
  const source = req.jdUrl ? `URL: ${req.jdUrl}` : 'pasted JD text'
  const sample = req.jdText ? req.jdText.slice(0, 60).replace(/\s+/g, ' ').trim() : 'role at company'
  const bullets = [
    `(Demo) Drive end-to-end ownership of ${sample}…`,
    '(Demo) Collaborate cross-functionally with engineering and design',
    '(Demo) 2-4 years of relevant experience',
    '(Demo) Strong analytical and communication skills',
    '(Demo) Hybrid work model in central Tel Aviv',
    '(Demo) Tech stack: TypeScript, React, Node.js',
    '(Demo) Competitive salary + equity package',
  ]
  return {
    headline: `(Demo summary from ${source})`,
    bullets,
    bodyText: `(Demo summary from ${source})\n\n${bullets.map(b => `• ${b}`).join('\n')}`,
  }
}

async function summarizeJD(
  req: JDSummarizeRequest
): Promise<AIGeneratorResult<JDSummarizeResponse>> {
  if (!isAIEnabled()) {
    await delay(700)
    return { data: mockJDSummarize(req), fromFallback: true, fallbackReason: 'disabled' }
  }
  try {
    const res = await aiClientService.summarizeJD(req)
    if (res.ok) return { data: res.data, fromFallback: false }
    return {
      data: mockJDSummarize(req),
      fromFallback: true,
      fallbackReason: classifyError(res.error),
    }
  } catch {
    return {
      data: mockJDSummarize(req),
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
  fillCompany,
  parseCV,
  summarizeJD,
  savePrepPack,
}
