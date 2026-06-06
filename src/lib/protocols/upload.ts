/**
 * Protocol upload — SSOT for file-type rules.
 *
 * Pure functions. No React, no DOM, no I/O. Safe to import from client
 * components, hooks, server route handlers, and tests.
 *
 * Defines what kinds of sources a protocol upload accepts (audio +
 * text), the file-extension and MIME mappings, and small validators
 * that mirror their audio counterpart (validateAudioUpload).
 *
 * The audio side keeps its existing validator (audio-validation.ts) —
 * that file is the SSOT for audio. We re-import it here so callers
 * have ONE module to consume for both kinds.
 */

import { FILE_SIZE_LIMITS } from '@/config/limits'
import { validateAudioUpload, type AudioFileLike } from './audio-validation'

// ─── Kinds ──────────────────────────────────────────────────────────────
export const PROTOCOL_UPLOAD_KIND = {
  AUDIO: 'audio',
  TEXT: 'text',
} as const
export type ProtocolUploadKind = typeof PROTOCOL_UPLOAD_KIND[keyof typeof PROTOCOL_UPLOAD_KIND]

// ─── Extension + MIME tables ───────────────────────────────────────────
//
// Audio extensions kept in sync with ALLOWED_AUDIO_MIME_TYPES in
// audio-validation.ts. If you add a new audio format, update both.
const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.wav', '.ogg', '.webm', '.flac', '.mp4'] as const
const TEXT_EXTENSIONS = ['.txt', '.md', '.json'] as const

const TEXT_MIME_PREFIXES = ['text/', 'application/json'] as const

// Tuned for the use case: an hour of meeting transcript runs ~80 KB
// of text. 5 MB caps even chunked agendas + multiple inserts well
// under the 100K-char schema cap on the AI side.
const TEXT_MAX_SIZE_BYTES = 5 * 1024 * 1024

export const TEXT_UPLOAD_LIMITS = {
  maxSizeBytes: TEXT_MAX_SIZE_BYTES,
}

// ─── classifyFile ──────────────────────────────────────────────────────
/**
 * Decide whether a file is audio, text, or neither.
 *
 * Extension first — most browsers report MIME for .txt as 'text/plain'
 * but for .md or .json it varies. Falling back to MIME prefix only
 * after extension is unknown.
 *
 * Returns null for unsupported types — callers should surface a
 * "format not supported" error.
 */
export interface ClassifiableFile {
  name: string
  type: string
}
export function classifyFile(file: ClassifiableFile): ProtocolUploadKind | null {
  const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase()
  if ((AUDIO_EXTENSIONS as readonly string[]).includes(ext)) return PROTOCOL_UPLOAD_KIND.AUDIO
  if ((TEXT_EXTENSIONS as readonly string[]).includes(ext)) return PROTOCOL_UPLOAD_KIND.TEXT

  if (file.type) {
    if (file.type.startsWith('audio/')) return PROTOCOL_UPLOAD_KIND.AUDIO
    if (TEXT_MIME_PREFIXES.some((p) => file.type.startsWith(p))) return PROTOCOL_UPLOAD_KIND.TEXT
  }
  return null
}

// ─── getAcceptString ───────────────────────────────────────────────────
/**
 * Build the <input type="file" accept="..."> attribute value covering
 * every supported extension. Single source — if extensions change here,
 * the picker updates automatically.
 */
export function getAcceptString(): string {
  return [...AUDIO_EXTENSIONS, ...TEXT_EXTENSIONS].join(',')
}

// ─── Validators ────────────────────────────────────────────────────────
/**
 * Validate a text upload (size + non-empty).
 * Returns a German-language error message on failure, null on success.
 * Mirrors the shape of validateAudioUpload — both kinds, same contract.
 */
export interface TextFileLike {
  size: number
  name: string
}
export function validateTextUpload(file: TextFileLike): string | null {
  if (!file) return 'Bitte wähle eine Textdatei aus.'
  if (file.size <= 0) return 'Die Textdatei ist leer.'
  if (file.size > TEXT_MAX_SIZE_BYTES) {
    const maxMb = Math.round(TEXT_MAX_SIZE_BYTES / (1024 * 1024))
    return `Die Textdatei ist zu gross (maximal ${maxMb} MB).`
  }
  return null
}

/**
 * Dispatch validator: route to the right kind-specific validator.
 * Audio re-uses the existing validateAudioUpload (its rules are richer
 * than text's, including MIME enforcement).
 */
export function validateUpload(kind: ProtocolUploadKind, file: AudioFileLike | TextFileLike): string | null {
  if (kind === PROTOCOL_UPLOAD_KIND.AUDIO) return validateAudioUpload(file as AudioFileLike)
  return validateTextUpload(file as TextFileLike)
}

// ─── Public size limits surface for UI hints ───────────────────────────
/**
 * Surfaced so the uploader can render "Audio: max X MB · Text: max Y MB"
 * without re-deriving from FILE_SIZE_LIMITS.
 */
export const PROTOCOL_UPLOAD_LIMITS = {
  audioMaxBytes: FILE_SIZE_LIMITS.AUDIO_MAX,
  textMaxBytes: TEXT_MAX_SIZE_BYTES,
}
