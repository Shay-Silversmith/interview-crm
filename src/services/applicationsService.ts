import type { JobApplication } from '@/types'
import { mockStore } from '@/data/mock-store'
import { MOCK_DELAY_MS } from '@/lib/constants'
import { isSupabaseMode } from '@/lib/env'
import { getSupabaseClient } from '@/lib/supabase'
import { mapApplication, mapInterviewStage } from '@/lib/mappers'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

// ---------------------------------------------------------------------------
// Mock implementation (in-memory CRUD)
// ---------------------------------------------------------------------------
const mockImpl = {
  async list(): Promise<JobApplication[]> {
    await delay(); return mockStore.applications.list()
  },
  async getById(id: string): Promise<JobApplication | null> {
    await delay(); return mockStore.applications.getById(id)
  },
  async getByCompany(companyId: string): Promise<JobApplication[]> {
    await delay(); return mockStore.applications.list().filter(a => a.companyId === companyId)
  },
  async create(data: Partial<JobApplication>): Promise<JobApplication> {
    await delay(); return mockStore.applications.create(data)
  },
  async update(id: string, data: Partial<JobApplication>): Promise<JobApplication> {
    await delay(); return mockStore.applications.update(id, data)
  },
  async delete(id: string): Promise<void> {
    await delay(); mockStore.applications.delete(id)
  },
}

// ---------------------------------------------------------------------------
// Supabase implementation
// ---------------------------------------------------------------------------
const supabaseImpl = {
  async list(): Promise<JobApplication[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('job_applications').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapApplication)
  },
  async getById(id: string): Promise<JobApplication | null> {
    const sb = getSupabaseClient()
    const { data: app, error } = await sb.from('job_applications').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    if (!app) return null
    const { data: stages } = await sb.from('interview_stages').select('*').eq('application_id', id).order('stage_order')
    const mapped = mapApplication(app)
    mapped.interviewStages = (stages ?? []).map(mapInterviewStage)
    return mapped
  },
  async getByCompany(companyId: string): Promise<JobApplication[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('job_applications').select('*').eq('company_id', companyId).order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapApplication)
  },
  async create(data: Partial<JobApplication>): Promise<JobApplication> {
    const sb = getSupabaseClient()
    const row = {
      company_id: data.companyId,
      company_name: data.companyName,
      role_name: data.roleName,
      role_url: data.roleUrl,
      job_description: data.jobDescription,
      stage: data.stage ?? 'Interested',
      priority: data.priority ?? 'Medium',
      work_model: data.workModel,
      location: data.location,
      salary_min: data.salaryMin,
      salary_max: data.salaryMax,
      currency: data.currency,
      fit_score: data.fitScore,
      urgency_score: data.urgencyScore,
      why_interesting: data.whyInteresting,
      what_to_emphasize: data.whatToEmphasize,
      notes: data.notes,
      applied_at: data.appliedAt,
      deadline_at: data.deadlineAt,
    }
    const { data: inserted, error } = await sb.from('job_applications').insert(row).select().single()
    if (error) throw new Error(error.message)
    return mapApplication(inserted)
  },
  async update(id: string, data: Partial<JobApplication>): Promise<JobApplication> {
    const sb = getSupabaseClient()
    const row: Record<string, unknown> = {}
    if (data.stage !== undefined) row.stage = data.stage
    if (data.priority !== undefined) row.priority = data.priority
    if (data.roleName !== undefined) row.role_name = data.roleName
    if (data.roleUrl !== undefined) row.role_url = data.roleUrl
    if (data.companyId !== undefined) row.company_id = data.companyId
    if (data.companyName !== undefined) row.company_name = data.companyName
    if (data.jobDescription !== undefined) row.job_description = data.jobDescription
    if (data.workModel !== undefined) row.work_model = data.workModel
    if (data.location !== undefined) row.location = data.location
    if (data.salaryMin !== undefined) row.salary_min = data.salaryMin
    if (data.salaryMax !== undefined) row.salary_max = data.salaryMax
    if (data.notes !== undefined) row.notes = data.notes
    if (data.whyInteresting !== undefined) row.why_interesting = data.whyInteresting
    if (data.whatToEmphasize !== undefined) row.what_to_emphasize = data.whatToEmphasize
    if (data.appliedAt !== undefined) row.applied_at = data.appliedAt
    if (data.deadlineAt !== undefined) row.deadline_at = data.deadlineAt
    if (data.fitScore !== undefined) row.fit_score = data.fitScore
    if (data.urgencyScore !== undefined) row.urgency_score = data.urgencyScore
    if (data.submittedCvId   !== undefined) row.submitted_cv_version_id = data.submittedCvId   || null
    if (data.submittedCvName !== undefined) row.submitted_cv_name        = data.submittedCvName || null
    if (data.aiRoleSummary !== undefined) row.ai_role_summary = data.aiRoleSummary
    const { data: updated, error } = await sb.from('job_applications').update(row).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return mapApplication(updated)
  },
  async delete(id: string): Promise<void> {
    const sb = getSupabaseClient()
    const { error } = await sb.from('job_applications').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

export const applicationsService = isSupabaseMode() ? supabaseImpl : mockImpl
