import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CVVersion, Document } from '@/types'
import { documentsService } from '@/services/documentsService'
import { deleteFromBucket } from '@/lib/storage'
import { useToastActions } from './useToast'
import { QK } from '@/lib/query-keys'

export function useDocumentMutations() {
  const qc = useQueryClient()
  const toast = useToastActions()

  const invalidateCVs  = () => void qc.invalidateQueries({ queryKey: QK.cvVersions.all() })
  const invalidateDocs = () => void qc.invalidateQueries({ queryKey: QK.documents.all() })

  const createCV = useMutation({
    mutationFn: (data: Partial<CVVersion>) => documentsService.createCV(data),
    onSuccess: () => { toast.success('CV version added'); invalidateCVs() },
    onError: (e: Error) => toast.error(e.message),
  })

  const updateCV = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CVVersion> }) =>
      documentsService.updateCV(id, data),
    onSuccess: () => { toast.success('CV version updated'); invalidateCVs() },
    onError: (e: Error) => toast.error(e.message),
  })

  /**
   * Storage-first delete for CV versions.
   * If the storage delete fails the operation aborts (file still exists).
   * If the DB delete fails after storage succeeded we warn but don't surface
   * an error to the user (orphaned DB row, file already gone).
   */
  const deleteCV = useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath?: string }) => {
      if (storagePath) {
        try {
          await deleteFromBucket('cv-files', storagePath)
        } catch (err) {
          throw new Error(
            `Could not delete the file from storage. The CV version was NOT removed. (${(err as Error).message})`
          )
        }
      }
      try {
        await documentsService.deleteCV(id)
      } catch (err) {
        // File already deleted from storage; only log an orphan warning.
        console.warn('CV DB row delete failed after storage delete succeeded (orphan):', err)
      }
    },
    onSuccess: () => { toast.success('CV version deleted'); invalidateCVs() },
    onError: (e: Error) => toast.error(e.message),
  })

  const createDoc = useMutation({
    mutationFn: (data: Partial<Document>) => documentsService.createDocument(data),
    onSuccess: () => { toast.success('Document added'); invalidateDocs() },
    onError: (e: Error) => toast.error(e.message),
  })

  /**
   * Storage-first delete for documents.
   */
  const deleteDoc = useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath?: string }) => {
      if (storagePath) {
        try {
          await deleteFromBucket('documents', storagePath)
        } catch (err) {
          throw new Error(
            `Could not delete the file from storage. The document was NOT removed. (${(err as Error).message})`
          )
        }
      }
      try {
        await documentsService.deleteDocument(id)
      } catch (err) {
        console.warn('Document DB row delete failed after storage delete succeeded (orphan):', err)
      }
    },
    onSuccess: () => { toast.success('Document deleted'); invalidateDocs() },
    onError: (e: Error) => toast.error(e.message),
  })

  return { createCV, updateCV, deleteCV, createDoc, deleteDoc }
}
