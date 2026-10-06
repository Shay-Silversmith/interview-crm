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

/**
 * What a document can be. Wider than a CV's PDF-only, because the things worth
 * keeping beside an application are not all documents: a take-home arrives as
 * a zip, its brief as a PDF, the submission as slides.
 *
 * Kept in step with the 'documents' bucket's allowed_mime_types
 * (supabase/migrations/0006) — the bucket has the final say and refuses
 * anything not listed there, whatever this dialog lets through.
 */
const DOC_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'text/markdown',
  'image/png',
  'image/jpeg',
]
const DOC_EXTENSIONS = ['.pdf', '.docx', '.doc', '.pptx', '.xlsx', '.zip', '.txt', '.md', '.png', '.jpg', '.jpeg']

/**
 * The type to store the file under.
 *
 * The bucket checks the upload's content type against its allow-list, so a
 * zip the browser reported with no type at all would be refused as
 * application/octet-stream. Name it from the extension when the browser did
 * not.
 */
function contentTypeFor(file: File): string {
  if (file.type && DOC_MIME_TYPES.includes(file.type)) return file.type
  const name = file.name.toLowerCase()
  if (name.endsWith('.zip'))  return 'application/zip'
  if (name.endsWith('.md'))   return 'text/markdown'
  if (name.endsWith('.txt'))  return 'text/plain'
  if (name.endsWith('.pdf'))  return 'application/pdf'
  if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (name.endsWith('.doc'))  return 'application/msword'
  if (name.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  if (name.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (name.endsWith('.png'))  return 'image/png'
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
  return file.type || 'application/octet-stream'
}

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
      await uploadToBucket('documents', path, file, contentTypeFor(file))

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
              accept={DOC_MIME_TYPES}
              extensions={DOC_EXTENSIONS}
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
