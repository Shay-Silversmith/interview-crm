// ---------------------------------------------------------------------------
// DocumentUploadDialog — Modal: FileDropzone + DocumentForm
// Accepts optional applicationId to pre-link the document to an application.
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { FileDropzone } from '@/components/ui/FileDropzone'
import { DocumentForm } from '@/components/forms/DocumentForm'
import type { DocumentFormValues } from '@/lib/schemas/documentSchema'
import { uploadToBucket, buildDocPath, getCurrentUserId } from '@/lib/storage'
import { useDocumentMutations } from '@/hooks/useDocumentMutations'
import { useToastActions } from '@/hooks/useToast'

interface DocumentUploadDialogProps {
  open: boolean
  onClose: () => void
  /** Pre-links the created document to this application */
  applicationId?: string
}

export function DocumentUploadDialog({ open, onClose, applicationId }: DocumentUploadDialogProps) {
  const [file, setFile]           = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const { createDoc } = useDocumentMutations()
  const toast = useToastActions()

  async function handleSubmit(values: DocumentFormValues) {
    if (!file) {
      setFileError('Please select a file before saving.')
      return
    }
    setFileError(null)

    try {
      const userId = await getCurrentUserId()
      const path   = buildDocPath(userId, file.name)
      await uploadToBucket('documents', path, file)

      await createDoc.mutateAsync({
        name:           values.name,
        type:           values.type,
        notes:          values.notes,
        fileName:       file.name,
        fileSize:       file.size,
        storagePath:    path,
        applicationIds: applicationId ? [applicationId] : [],
      })

      setFile(null)
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  function handleClose() {
    setFile(null)
    setFileError(null)
    onClose()
  }

  const isLoading = createDoc.isPending

  return (
    <Modal open={open} onClose={handleClose} title="Upload document" size="md">
      <DocumentForm
        onSubmit={handleSubmit}
        onCancel={handleClose}
        loading={isLoading}
        fileSlot={
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              File <span className="text-danger-500">*</span>
            </label>
            <FileDropzone
              value={file}
              onChange={f => { setFile(f); setFileError(null) }}
              disabled={isLoading}
            />
            {fileError && (
              <p className="text-xs text-danger-600">{fileError}</p>
            )}
          </div>
        }
      />
    </Modal>
  )
}
