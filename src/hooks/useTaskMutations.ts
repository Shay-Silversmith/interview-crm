import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Task } from '@/types'
import { tasksService } from '@/services/tasksService'
import { useToastActions } from './useToast'
import { QK } from '@/lib/query-keys'

export function useTaskMutations() {
  const qc = useQueryClient()
  const toast = useToastActions()

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: QK.tasks.all() })
    void qc.invalidateQueries({ queryKey: QK.dashboard.all() })
  }

  const create = useMutation({
    mutationFn: (data: Partial<Task>) => tasksService.create(data),
    onSuccess: () => { toast.success('Task created'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => tasksService.update(id, data),
    onSuccess: () => { toast.success('Task updated'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  const complete = useMutation({
    mutationFn: (id: string) => tasksService.update(id, { status: 'Done', completedAt: new Date().toISOString() }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.tasks.all() })
      const snapshot = qc.getQueryData<Task[]>(QK.tasks.all())
      qc.setQueryData<Task[]>(QK.tasks.all(), old =>
        old?.map(t => t.id === id ? { ...t, status: 'Done' as const, completedAt: new Date().toISOString() } : t) ?? []
      )
      return { snapshot }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(QK.tasks.all(), ctx.snapshot)
      toast.error('Failed to complete task')
    },
    onSuccess: () => { toast.success('Task completed ✓'); invalidate() },
  })

  const remove = useMutation({
    mutationFn: (id: string) => tasksService.delete(id),
    onSuccess: () => { toast.success('Task deleted'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  return { create, update, complete, remove }
}
