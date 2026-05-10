import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InterviewStage } from '@/types'
import { interviewStageService } from '@/services/interviewStageService'
import { useToastActions } from './useToast'
import { QK } from '@/lib/query-keys'

export function useInterviewStageMutations(applicationId: string) {
  const qc = useQueryClient()
  const toast = useToastActions()

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: QK.applications.detail(applicationId) })
    void qc.invalidateQueries({ queryKey: QK.applications.all() })
  }

  const create = useMutation({
    mutationFn: (data: Partial<InterviewStage>) =>
      interviewStageService.create({ ...data, applicationId }),
    onSuccess: () => { toast.success('Interview round added'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterviewStage> }) =>
      interviewStageService.update(id, data),
    onSuccess: () => { toast.success('Interview round updated'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => interviewStageService.delete(id),
    onSuccess: () => { toast.success('Interview round deleted'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  return { create, update, remove }
}
