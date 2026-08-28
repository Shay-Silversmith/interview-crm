// ---------------------------------------------------------------------------
// InterviewFlow — interviewStageService.ts
// CRUD for interview rounds within a job application.
// ---------------------------------------------------------------------------

import type { InterviewStage } from '@/types'
import { mockStore } from '@/data/mock-store'
import { MOCK_DELAY_MS } from '@/lib/constants'
import { isSupabaseMode } from '@/lib/env'
import { getSupabaseClient } from '@/lib/supabase'
import { mapInterviewStage } from '@/lib/mappers'

const delay = () => new Promise<void>(r => setTimeout(r, MOCK_DELAY_MS + Math.random() * 100))

// ---------------------------------------------------------------------------
// In-memory mock store slice for interview stages
// Stages are embedded on applications in the entity model, but we manage
// them as a separate collection in the mock store for easier CRUD.
// ---------------------------------------------------------------------------
type StageRow = InterviewStage & { updatedAt: string; createdAt: string }

let _stages: StageRow[] = []

// On first call, seed from existing applications
function getStages(): StageRow[] {
  if (_stages.length === 0) {
    const apps = mockStore.applications.list()
    _stages = apps.flatMap(a =>
      a.interviewStages.map(s => ({
        ...s,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    )
  }
  return _stages
}

function setStages(v: StageRow[]) { _stages = v }

function newId(): string {
  return [Math.random().toString(36).slice(2, 9), Math.random().toString(36).slice(2, 9)].join('-')
}

const mockImpl = {
  async listByApplication(applicationId: string): Promise<InterviewStage[]> {
    await delay()
    return getStages().filter(s => s.applicationId === applicationId)
  },
  async create(data: Partial<InterviewStage>): Promise<InterviewStage> {
    await delay()
    const stage: StageRow = {
      id: newId(),
      applicationId: data.applicationId ?? '',
      type: data.type ?? 'Phone Screen',
      outcome: data.outcome ?? 'Pending',
      scheduledAt: data.scheduledAt,
      completedAt: data.completedAt,
      duration: data.duration,
      interviewer: data.interviewer,
      interviewerTitle: data.interviewerTitle,
      notes: data.notes,
      feedbackReceived: data.feedbackReceived,
      nextSteps: data.nextSteps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setStages([...getStages(), stage])
    // Sync into the application record
    const app = mockStore.applications.getById(stage.applicationId)
    if (app) {
      mockStore.applications.update(stage.applicationId, {
        interviewStages: [...app.interviewStages, stage],
      })
    }
    return stage
  },
  async update(id: string, data: Partial<InterviewStage>): Promise<InterviewStage> {
    await delay()
    const arr = getStages()
    const idx = arr.findIndex(s => s.id === id)
    if (idx === -1) throw new Error(`Stage ${id} not found`)
    const updated = { ...arr[idx], ...data, updatedAt: new Date().toISOString() }
    const next = [...arr]
    next[idx] = updated
    setStages(next)
    // Sync into the application record
    const app = mockStore.applications.getById(updated.applicationId)
    if (app) {
      mockStore.applications.update(updated.applicationId, {
        interviewStages: app.interviewStages.map(s => s.id === id ? updated : s),
      })
    }
    return updated
  },
  async delete(id: string): Promise<void> {
    await delay()
    const stage = getStages().find(s => s.id === id)
    setStages(getStages().filter(s => s.id !== id))
    if (stage) {
      const app = mockStore.applications.getById(stage.applicationId)
      if (app) {
        mockStore.applications.update(stage.applicationId, {
          interviewStages: app.interviewStages.filter(s => s.id !== id),
        })
      }
    }
  },
}

const supabaseImpl = {
  async listByApplication(applicationId: string): Promise<InterviewStage[]> {
    const sb = getSupabaseClient()
    const { data, error } = await sb.from('interview_stages').select('*').eq('application_id', applicationId).order('stage_order')
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapInterviewStage)
  },
  async create(data: Partial<InterviewStage>): Promise<InterviewStage> {
    const sb = getSupabaseClient()
    const { data: inserted, error } = await sb.from('interview_stages').insert({
      application_id: data.applicationId,
      type: data.type ?? 'Phone Screen',
      outcome: data.outcome ?? 'Pending',
      scheduled_at: data.scheduledAt,
      completed_at: data.completedAt,
      duration: data.duration,
      interviewer: data.interviewer,
      interviewer_title: data.interviewerTitle,
      notes: data.notes,
      feedback_received: data.feedbackReceived,
      next_steps: data.nextSteps,
    }).select().single()
    if (error) throw new Error(error.message)
    return mapInterviewStage(inserted)
  },
  async update(id: string, data: Partial<InterviewStage>): Promise<InterviewStage> {
    const sb = getSupabaseClient()
    const row: Record<string, unknown> = {}
    if (data.type !== undefined) row.type = data.type
    if (data.outcome !== undefined) row.outcome = data.outcome
    if (data.scheduledAt !== undefined) row.scheduled_at = data.scheduledAt
    if (data.completedAt !== undefined) row.completed_at = data.completedAt
    if (data.duration !== undefined) row.duration = data.duration
    if (data.interviewer !== undefined) row.interviewer = data.interviewer
    if (data.interviewerTitle !== undefined) row.interviewer_title = data.interviewerTitle
    if (data.notes !== undefined) row.notes = data.notes
    if (data.feedbackReceived !== undefined) row.feedback_received = data.feedbackReceived
    if (data.nextSteps !== undefined) row.next_steps = data.nextSteps
    const { data: updated, error } = await sb.from('interview_stages').update(row).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return mapInterviewStage(updated)
  },
  async delete(id: string): Promise<void> {
    const sb = getSupabaseClient()
    const { error } = await sb.from('interview_stages').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

export const interviewStageService = isSupabaseMode() ? supabaseImpl : mockImpl
