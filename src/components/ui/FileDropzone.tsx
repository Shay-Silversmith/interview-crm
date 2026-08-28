import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatFileSize } from '@/utils/format'

const ACCEPTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const ACCEPTED_EXT   = ['.pdf', '.docx']
const MAX_BYTES      = 10 * 1024 * 1024 // 10 MB

interface FileDropzoneProps {
  /** Currently selected file */
  value?: File | null
  onChange: (file: File | null) => void
  /** Accepted MIME types — defaults to PDF + DOCX */
  accept?: string[]
  /** Max size in bytes — defaults to 10 MB */
  maxSize?: number
  disabled?: boolean
  /** Extra classes for the root element */
  className?: string
}

export function FileDropzone({
  value,
  onChange,
  accept = ACCEPTED_TYPES,
  maxSize = MAX_BYTES,
  disabled = false,
  className,
}: FileDropzoneProps) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  function validate(file: File): string | null {
    if (!accept.includes(file.type)) {
      return `Unsupported file type. Please upload ${ACCEPTED_EXT.join(' or ')}.`
    }
    if (file.size > maxSize) {
      return `File too large. Maximum size is ${formatFileSize(maxSize)}.`
    }
    return null
  }

  function handleFile(file: File) {
    const err = validate(file)
    if (err) { setError(err); return }
    setError(null)
    onChange(file)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  function handleRemove() {
    setError(null)
    onChange(null)
  }

  // ── Selected state ──────────────────────────────────────────────────────────
  if (value) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3',
          className,
        )}
      >
        <FileText className="w-5 h-5 text-violet-500 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800 truncate">{value.name}</p>
          <p className="text-xs text-slate-500">{formatFileSize(value.size)}</p>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleRemove}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  // ── Drop zone ───────────────────────────────────────────────────────────────
  return (
    <div className={cn('space-y-1.5', className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onDragEnter={e => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => { if (!disabled) inputRef.current?.click() }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!disabled) inputRef.current?.click() } }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 transition-colors cursor-pointer select-none',
          dragging
            ? 'border-violet-400 bg-violet-50'
            : error
              ? 'border-danger-300 bg-danger-50'
              : 'border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/40',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        aria-disabled={disabled}
      >
        <Upload className={cn('w-7 h-7', dragging ? 'text-violet-500' : 'text-slate-400')} />
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">
            {dragging ? 'Drop to upload' : 'Drag & drop or click to browse'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            PDF or DOCX · max {formatFileSize(maxSize)}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-danger-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept.join(',')}
        onChange={handleChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
      />
    </div>
  )
}
