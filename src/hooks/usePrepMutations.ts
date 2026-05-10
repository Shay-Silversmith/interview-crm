import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PreparedAnswer } from '@/types'
import { prepService } from '@/services/prepService'
import { useToastActions } from './useToast'
import { QK } from '@/lib/query-keys'

export function usePrepMutations() {
  const qc = useQueryClient()
  const toast = useToastActions()
  const invalidate = () => void qc.invalidateQueries({ queryKey: QK.prep.all() })

  const create = useMutation({
    mutationFn: (data: Partial<PreparedAnswer>) => prepService.create(data),
    onSuccess: () => { toast.success('Answer added'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PreparedAnswer> }) => prepService.update(id, data),
    onSuccess: () => { toast.success('Answer updated'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: (id: string) => prepService.delete(id),
    onSuccess: () => { toast.success('Answer deleted'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  return { create, update, remove }
}
