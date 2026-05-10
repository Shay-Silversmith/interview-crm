import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { JobApplication } from '@/types'
import { applicationsService } from '@/services/applicationsService'
import { useToastActions } from './useToast'
import { QK } from '@/lib/query-keys'

export function useApplicationMutations() {
  const qc = useQueryClient()
  const toast = useToastActions()

  const invalidateAll = (id?: string) => {
    void qc.invalidateQueries({ queryKey: QK.applications.all() })
    if (id) void qc.invalidateQueries({ queryKey: QK.applications.detail(id) })
    void qc.invalidateQueries({ queryKey: QK.dashboard.all() })
  }

  // ── Create ─────────────────────────────────────────────────────────────────
  const create = useMutation({
    mutationFn: (data: Partial<JobApplication>) => applicationsService.create(data),
    onSuccess: () => { toast.success('Application added'); invalidateAll() },
    onError: (e: Error) => toast.error(e.message),
  })

  // ── Full update (drawer form) ─ optimistic on the detail cache ─────────────
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JobApplication> }) =>
      applicationsService.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: QK.applications.detail(id) })
      const snapshot = qc.getQueryData<JobApplication>(QK.applications.detail(id))
      qc.setQueryData<JobApplication>(QK.applications.detail(id), old =>
        old ? { ...old, ...data } : old
      )
      return { snapshot }
    },
    onError: (e: Error, { id }, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(QK.applications.detail(id), ctx.snapshot)
      toast.error(e.message || 'Failed to update application')
    },
    onSuccess: (_result, { id }) => { toast.success('Application updated'); invalidateAll(id) },
  })

  // ── Stage inline chip ─ optimistic on list + detail ────────────────────────
  const updateStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: JobApplication['stage'] }) =>
      applicationsService.update(id, { stage }),
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: QK.applications.all() })
      await qc.cancelQueries({ queryKey: QK.applications.detail(id) })
      const snapshotList   = qc.getQueryData<JobApplication[]>(QK.applications.all())
      const snapshotDetail = qc.getQueryData<JobApplication>(QK.applications.detail(id))
      qc.setQueryData<JobApplication[]>(QK.applications.all(), old =>
        old?.map(a => a.id === id ? { ...a, stage } : a) ?? []
      )
      qc.setQueryData<JobApplication>(QK.applications.detail(id), old =>
        old ? { ...old, stage } : old
      )
      return { snapshotList, snapshotDetail }
    },
    onError: (_e, { id }, ctx) => {
      if (ctx?.snapshotList)   qc.setQueryData(QK.applications.all(), ctx.snapshotList)
      if (ctx?.snapshotDetail) qc.setQueryData(QK.applications.detail(id), ctx.snapshotDetail)
      toast.error('Failed to update stage')
    },
    onSuccess: (_r, { id }) => { toast.success('Stage updated'); invalidateAll(id) },
  })

  // ── Priority inline chip ─ optimistic on list + detail ─────────────────────
  const updatePriority = useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: JobApplication['priority'] }) =>
      applicationsService.update(id, { priority }),
    onMutate: async ({ id, priority }) => {
      await qc.cancelQueries({ queryKey: QK.applications.all() })
      await qc.cancelQueries({ queryKey: QK.applications.detail(id) })
      const snapshotList   = qc.getQueryData<JobApplication[]>(QK.applications.all())
      const snapshotDetail = qc.getQueryData<JobApplication>(QK.applications.detail(id))
      qc.setQueryData<JobApplication[]>(QK.applications.all(), old =>
        old?.map(a => a.id === id ? { ...a, priority } : a) ?? []
      )
      qc.setQueryData<JobApplication>(QK.applications.detail(id), old =>
        old ? { ...old, priority } : old
      )
      return { snapshotList, snapshotDetail }
    },
    onError: (_e, { id }, ctx) => {
      if (ctx?.snapshotList)   qc.setQueryData(QK.applications.all(), ctx.snapshotList)
      if (ctx?.snapshotDetail) qc.setQueryData(QK.applications.detail(id), ctx.snapshotDetail)
      toast.error('Failed to update priority')
    },
    onSuccess: (_r, { id }) => { toast.success('Priority updated'); invalidateAll(id) },
  })

  // ── Delete ─────────────────────────────────────────────────────────────────
  const remove = useMutation({
    mutationFn: (id: string) => applicationsService.delete(id),
    onSuccess: () => { toast.success('Application deleted'); invalidateAll() },
    onError: (e: Error) => toast.error(e.message),
  })

  return { create, update, updateStage, updatePriority, remove }
}
