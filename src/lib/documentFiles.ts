// ---------------------------------------------------------------------------
// InterviewFlow — documentFiles.ts
// What a document upload may be, in one place.
//
// Wider than a CV's PDF-only, because the things worth keeping beside an
// application are not all documents: a take-home arrives as a zip, its brief
// as a PDF, the submission as slides.
//
// Kept in step with the 'documents' bucket's allowed_mime_types
// (supabase/migrations/0006) — the bucket has the final say and refuses
// anything not listed there, whatever the UI lets through.
// ---------------------------------------------------------------------------

export const DOC_MIME_TYPES = [
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

export const DOC_EXTENSIONS = [
  '.pdf', '.docx', '.doc', '.pptx', '.xlsx', '.zip', '.txt', '.md', '.png', '.jpg', '.jpeg',
]

/** Matches the bucket's file_size_limit. */
export const DOC_MAX_BYTES = 10 * 1024 * 1024

const BY_EXTENSION: Record<string, string> = {
  '.zip':  'application/zip',
  '.md':   'text/markdown',
  '.txt':  'text/plain',
  '.pdf':  'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc':  'application/msword',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot === -1 ? '' : fileName.slice(dot).toLowerCase()
}

/**
 * The type to store the file under.
 *
 * The bucket checks the upload's content type against its allow-list, so a
 * zip the browser reported with no type at all would be refused as
 * application/octet-stream. Name it from the extension when the browser did
 * not.
 */
export function contentTypeFor(file: File): string {
  if (file.type && DOC_MIME_TYPES.includes(file.type)) return file.type
  return BY_EXTENSION[extensionOf(file.name)] ?? (file.type || 'application/octet-stream')
}

/** Why this file cannot be uploaded, or null if it can. */
export function documentFileProblem(file: File): string | null {
  const known = DOC_MIME_TYPES.includes(file.type) || DOC_EXTENSIONS.includes(extensionOf(file.name))
  if (!known) return `"${file.name}" is not a supported type (${DOC_EXTENSIONS.join(', ')}).`
  if (file.size > DOC_MAX_BYTES) return `"${file.name}" is larger than 10 MB.`
  return null
}
