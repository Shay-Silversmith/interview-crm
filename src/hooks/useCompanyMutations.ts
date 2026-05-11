import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Company } from '@/types'
import { companiesService } from '@/services/companiesService'
import { useToastActions } from './useToast'
import { QK } from '@/lib/query-keys'

export function useCompanyMutations() {
  const qc = useQueryClient()
  const toast = useToastActions()

  const invalidate = (id?: string) => {
    void qc.invalidateQueries({ queryKey: QK.companies.all() })
    if (id) void qc.invalidateQueries({ queryKey: QK.companies.detail(id) })
    // Company name / logo / size are denormalized into applications and
    // surface in tasks → invalidate everything that consumes them.
    void qc.invalidateQueries({ queryKey: QK.applications.all() })
    void qc.invalidateQueries({ queryKey: QK.tasks.all() })
    void qc.invalidateQueries({ queryKey: QK.dashboard.all() })
  }

  const create = useMutation({
    mutationFn: (data: Partial<Company>) => companiesService.create(data),
    onSuccess: () => { toast.success('Company added'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Company> }) => companiesService.update(id, data),
    onSuccess: (_r, { id }) => { toast.success('Company updated'); invalidate(id) },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => companiesService.delete(id),
    onSuccess: () => { toast.success('Company deleted'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  return { create, update, remove }
}
