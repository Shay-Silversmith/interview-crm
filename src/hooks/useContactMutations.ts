import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Contact } from '@/types'
import { contactsService } from '@/services/contactsService'
import { useToastActions } from './useToast'
import { QK } from '@/lib/query-keys'

export function useContactMutations() {
  const qc = useQueryClient()
  const toast = useToastActions()

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: QK.contacts.all() })
  }

  const create = useMutation({
    mutationFn: (data: Partial<Contact>) => contactsService.create(data),
    onSuccess: () => { toast.success('Contact added'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contact> }) => contactsService.update(id, data),
    onSuccess: () => { toast.success('Contact updated'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => contactsService.delete(id),
    onSuccess: () => { toast.success('Contact deleted'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  return { create, update, remove }
}
