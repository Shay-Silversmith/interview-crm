// ---------------------------------------------------------------------------
// CVUploadDialog — Modal: FileDropzone + CVVersionForm
// File is required for new CVs; upload happens before DB insert.
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { FileDropzone } from '@/components/ui/FileDropzone'
import { CVVersionForm } from '@/components/forms/CVVersionForm'
import type { CVVersionFormValues } from '@/lib/schemas/cvVersionSchema'
import { uploadToBucket, buildCVPath, getCurrentUserId } from '@/lib/storage'
import { useDocumentMutations } from '@/hooks/useDocumentMutations'
import { useToastActions } from '@/hooks/useToast'

interface CVUploadDialogProps {
  open: boolean
  onClose: () => void
}

export function CVUploadDialog({ open, onClose }: CVUploadDialogProps) {
  const [file, setFile]       = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const { createCV } = useDocumentMutations()
  const toast = useToastActions()

  async function handleSubmit(values: CVVersionFormValues) {
    if (!file) {
      setFileError('Please select a file before saving.')
      return
    }
    setFileError(null)

    try {
      const userId = await getCurrentUserId()
      const path   = buildCVPath(userId, file.name)
      await uploadToBucket('cv-files', path, file)

      await createCV.mutateAsync({
        name:                values.name,
        version:             values.version,
        emphasis:            values.emphasis,
        skillsHighlighted:   values.skillsHighlighted?.split(',').map(s => s.trim()).filter(Boolean) ?? [],
        projectsHighlighted: values.projectsHighlighted?.split(',').map(s => s.trim()).filter(Boolean) ?? [],
        notes:               values.notes,
        isActive:            values.isActive,
        fileName:            file.name,
        fileSize:            file.size,
        storagePath:         path,
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

  const isLoading = createCV.isPending

  return (
    <Modal open={open} onClose={handleClose} title="Upload CV version" size="md">
      <CVVersionForm
        onSubmit={handleSubmit}
        onCancel={handleClose}
        loading={isLoading}
        fileSlot={
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              File <span className="text-red-500">*</span>
            </label>
            <FileDropzone
              value={file}
              onChange={f => { setFile(f); setFileError(null) }}
              disabled={isLoading}
            />
            {fileError && (
              <p className="text-xs text-red-600">{fileError}</p>
            )}
          </div>
        }
      />
    </Modal>
  )
}
