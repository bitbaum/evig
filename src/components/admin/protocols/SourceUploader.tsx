'use client'

/**
 * SourceUploader — drop-zone for protocol input sources.
 *
 * Presentation only. Knows nothing about protocols, processing, or
 * APIs — it accepts the current { audio, textFiles } state and emits
 * the next via onChange. The parent (form/hook) handles persistence
 * and submit.
 *
 * Why a single component rather than separate audio + text pickers:
 * the user dropping a meeting recording, the agenda, and their
 * handwritten notes wants ONE surface for ONE meeting. Mode-splitting
 * the UI would force "first pick audio then add text" thinking, which
 * is the friction the YY.1 refactor is removing.
 *
 * v1 scope (KISS / YAGNI):
 *   - At most one audio file (a second drop overwrites with a confirm).
 *   - Any number of text files.
 *   - No drag-reorder. No file preview. No progress bar. No mid-upload
 *     cancel (uploads happen all-at-once on form submit).
 *
 * SoC: drop logic, classification, validation are pulled from
 * lib/protocols/upload.ts (pure functions). This component only does
 * presentation + event glue.
 */

import { useRef, useState, type DragEvent } from 'react'
import { Upload, FileText, Mic, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  classifyFile,
  getAcceptString,
  validateUpload,
  PROTOCOL_UPLOAD_KIND,
  PROTOCOL_UPLOAD_LIMITS,
} from '@/lib/protocols/upload'

export interface SourceValue {
  audio: File | null
  textFiles: File[]
}

interface SourceUploaderProps {
  value: SourceValue
  onChange: (next: SourceValue) => void
  /** Surface validation errors back to the parent form. */
  onError?: (message: string) => void
  disabled?: boolean
}

const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function SourceUploader({ value, onChange, onError, disabled }: SourceUploaderProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const audioMaxMb = Math.round(PROTOCOL_UPLOAD_LIMITS.audioMaxBytes / (1024 * 1024))
  const textMaxMb = Math.round(PROTOCOL_UPLOAD_LIMITS.textMaxBytes / (1024 * 1024))

  /**
   * Accept an array of dropped/picked files, classify each, validate
   * each, and merge into the current value. A new audio replaces the
   * previous one (single-audio v1 invariant); text files accumulate.
   */
  const accept = (files: File[]) => {
    if (disabled) return

    let nextAudio = value.audio
    const nextTextFiles = [...value.textFiles]
    let firstError: string | null = null

    for (const file of files) {
      const kind = classifyFile(file)
      if (!kind) {
        firstError ??= `Dateiformat nicht unterstützt: ${file.name}`
        continue
      }
      const validationError = validateUpload(kind, file)
      if (validationError) {
        firstError ??= validationError
        continue
      }

      if (kind === PROTOCOL_UPLOAD_KIND.AUDIO) {
        nextAudio = file
      } else {
        // Dedupe text files by name — a re-drop of the same file
        // shouldn't accumulate duplicates.
        if (!nextTextFiles.some((f) => f.name === file.name && f.size === file.size)) {
          nextTextFiles.push(file)
        }
      }
    }

    if (firstError) onError?.(firstError)
    onChange({ audio: nextAudio, textFiles: nextTextFiles })
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingOver(false)
    if (disabled) return
    const dropped = Array.from(e.dataTransfer.files)
    if (dropped.length > 0) accept(dropped)
  }

  const handleClickToBrowse = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const handlePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    if (picked.length > 0) accept(picked)
    // Reset so picking the same file twice still fires onChange
    e.target.value = ''
  }

  const removeAudio = () => onChange({ ...value, audio: null })
  const removeTextFile = (name: string, size: number) =>
    onChange({
      ...value,
      textFiles: value.textFiles.filter((f) => !(f.name === name && f.size === size)),
    })

  const hasAny = value.audio !== null || value.textFiles.length > 0

  return (
    <div>
      {/* Drop zone — always visible. Click anywhere or drop files onto it. */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClickToBrowse}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClickToBrowse()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setIsDraggingOver(true)
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        aria-disabled={disabled}
        aria-label="Dateien hier ablegen oder klicken zum Auswählen"
        className={[
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors cursor-pointer',
          isDraggingOver
            ? 'border-action bg-action-muted'
            : 'border-strong bg-surface-raised hover:border-action',
          disabled && 'cursor-not-allowed opacity-50',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Upload className="w-8 h-8 text-text-tertiary" aria-hidden="true" />
        <div className="text-sm font-medium text-text-primary">
          Dateien hier ablegen oder klicken zum Auswählen
        </div>
        <div className="text-xs text-text-tertiary">
          Audio (max {audioMaxMb} MB) · Text {`(.txt .md .json)`} (max {textMaxMb} MB)
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={getAcceptString()}
          multiple
          onChange={handlePicked}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {/* Chips for accepted files */}
      {hasAny && (
        <ul className="mt-3 space-y-2" aria-label="Hochgeladene Quellen">
          {value.audio && (
            <li className="flex items-center gap-3 p-3 bg-surface-raised border border-strong rounded-lg">
              <Mic className="w-4 h-4 text-action shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">
                  {value.audio.name}
                </div>
                <div className="text-xs text-text-tertiary">{formatBytes(value.audio.size)}</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={removeAudio}
                disabled={disabled}
                aria-label={`${value.audio.name} entfernen`}
                className="shrink-0 text-text-tertiary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </Button>
            </li>
          )}
          {value.textFiles.map((file) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex items-center gap-3 p-3 bg-surface-raised border border-strong rounded-lg"
            >
              <FileText className="w-4 h-4 text-action shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">{file.name}</div>
                <div className="text-xs text-text-tertiary">{formatBytes(file.size)}</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeTextFile(file.name, file.size)}
                disabled={disabled}
                aria-label={`${file.name} entfernen`}
                className="shrink-0 text-text-tertiary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
