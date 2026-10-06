// ---------------------------------------------------------------------------
// StageAttachments — files attached to one interview round.
//
// A round often has files of its own: the brief for a test, the submission,
// the slides presented. They are ordinary documents — they also appear under
// the application's Files — with one extra link saying which round they
// belong to, so they can be found where the round is.
//
// Picking a file uploads it straight away. There is no name-and-type form in
// between: the round already says what the file is for, and the file name is
// the name.
// ---------------------------------------------------------------------------
import { useRef, useState } from 'react'
import { FileText, Loader2, Paperclip, Trash2 } from 'lucide-react'
import type { Document } from '@/types'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DocumentViewerButton } from '@/components/documents/DocumentViewerButton'
import { useDocumentMutations } from '@/hooks/useDocumentMutations'
import { useToastActions } from '@/hooks/useToast'
import { useI18n } from '@/hooks/useI18n'
import { uploadToBucket, buildDocPath, getCurrentUserId } from '@/lib/storage'
import { DOC_MIME_TYPES, DOC_EXTENSIONS, contentTypeFor, documentFileProblem } from '@/lib/documentFiles'
import { formatFileSize } from '@/utils/format'

interface StageAttachmentsProps {
  stageId:       string
  applicationId: string
  /** The documents already attached to this round. */
  documents:     Document[]
}

export function StageAttachments({ stageId, applicationId, documents }: StageAttachmentsProps) {
  const { t } = useI18n()
  const toast = useToastActions()
  const { createDoc, deleteDoc } = useDocumentMutations()

  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [toDelete, setToDelete]   = useState<Document | null>(null)

  async function handleFiles(files: File[]) {
    if (files.length === 0) return
    setUploading(true)
    try {
      const userId = await getCurrentUserId()
      // One at a time: a failure names the file it happened on, and the ones
      // before it are already safely attached.
      for (const file of files) {
        const problem = documentFileProblem(file)
        if (problem) { toast.error(problem); continue }

        const path = buildDocPath(userId, file.name)
        await uploadToBucket('documents', path, file, contentTypeFor(file))
        try {
          await createDoc.mutateAsync({
            name:           file.name,
            type:           'Assignment',
            fileName:       file.name,
            fileSize:       file.size,
            storagePath:    path,
            applicationIds: [applicationId],
            stageId,
          })
        } catch (err) {
          // createDoc has already shown the reason; nothing more to add here.
          console.warn('Attachment uploaded but its record was not saved:', err)
        }
      }
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest">
          {t('pages.applicationDetail.stageFiles')}
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700 hover:text-violet-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Paperclip className="w-3.5 h-3.5" />}
          {uploading
            ? t('pages.applicationDetail.stageFilesUploading')
            : t('pages.applicationDetail.attachFile')}
        </button>
      </div>

      {documents.length === 0 ? (
        <p className="text-xs text-slate-400">{t('pages.applicationDetail.noStageFiles')}</p>
      ) : (
        <div className="space-y-1">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-2.5 py-1.5">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 truncate force-ltr">{doc.fileName || doc.name}</p>
                {doc.fileSize ? <p className="text-2xs text-slate-400">{formatFileSize(doc.fileSize)}</p> : null}
              </div>
              {doc.storagePath && (
                <DocumentViewerButton
                  storagePath={doc.storagePath}
                  label={t('pages.applicationDetail.openFile')}
                  className="text-xs"
                />
              )}
              <button
                type="button"
                onClick={() => setToDelete(doc)}
                className="p-1 rounded hover:bg-danger-50 text-slate-400 hover:text-danger-600 transition-colors"
                aria-label={t('common.delete')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={[...DOC_MIME_TYPES, ...DOC_EXTENSIONS].join(',')}
        onChange={e => {
          const picked = Array.from(e.target.files ?? [])
          // Reset so the same file can be picked again after a failure.
          e.target.value = ''
          void handleFiles(picked)
        }}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return
          deleteDoc.mutate(
            { id: toDelete.id, storagePath: toDelete.storagePath },
            { onSettled: () => setToDelete(null) },
          )
        }}
        title={t('pages.applicationDetail.deleteFileTitle')}
        description={t('pages.applicationDetail.deleteFileDescription', { name: toDelete?.fileName || toDelete?.name || '' })}
        confirmLabel={t('common.delete')}
        loading={deleteDoc.isPending}
        variant="danger"
      />
    </div>
  )
}
