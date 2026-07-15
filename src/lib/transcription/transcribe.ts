/**
 * Speech-to-text — Groq Whisper first, self-hosted faster-whisper fallback.
 *
 * WHY: the self-hosted faster-whisper service (SERVICE_URLS.TRANSCRIPTION) only
 * runs in local dev — it is NOT deployed on the prod box, so protocol/meeting
 * audio could not be transcribed on prod at all. Groq's hosted Whisper
 * (whisper-large-v3-turbo) needs only GROQ_API_KEY (already set in prod), is
 * fast/cheap/cross-browser, and is the same provider OrangeCat + FleetCrown use.
 *
 * Strategy (mirrors FleetCrown's hybrid): try Groq first; fall back to the local
 * service on any Groq failure or when the file exceeds Groq's upload limit.
 * Shared by any surface that needs transcription (protocols today; Hirn/erfassung
 * voice next) — callers pass a Blob/File, get `{ text, provider, model }`.
 */

import { SERVICE_URLS } from '@/config/services'
import { logger } from '@/lib/logger'

const GROQ_TRANSCRIBE_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const GROQ_WHISPER_MODEL = 'whisper-large-v3-turbo'
// Groq caps uploads at ~25 MB; leave headroom. Bigger files route to the local
// service (browser opus/webm is ~0.5 MB/min, so this covers long meetings).
const GROQ_MAX_BYTES = 24 * 1024 * 1024

export type TranscribeProvider = 'groq' | 'local'
export interface TranscribeResult {
  /** Transcribed text (may be empty when no speech was detected). */
  text: string
  provider: TranscribeProvider
  model: string
}

/** Thrown only when NO provider could produce a result (both unavailable). */
export class TranscriptionUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TranscriptionUnavailableError'
  }
}

/** Header values reject control chars / stray whitespace — trim defensively. */
function sanitizeKey(key: string): string {
  return key.replace(/[\s\x00-\x1f\x7f]+/g, '')
}

async function transcribeViaGroq(audio: Blob, language: string, filename: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not set')

  const form = new FormData()
  form.append('file', audio, filename || 'audio.webm')
  form.append('model', GROQ_WHISPER_MODEL)
  form.append('response_format', 'json')
  if (language) form.append('language', language)

  const res = await fetch(GROQ_TRANSCRIBE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sanitizeKey(apiKey)}` },
    body: form,
  })
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 300)
    throw new Error(`Groq ${res.status}: ${detail}`)
  }
  const data = (await res.json()) as { text?: string }
  return (data.text ?? '').trim()
}

async function transcribeViaLocal(audio: Blob, language: string, model?: string): Promise<string> {
  const modelParam = model ? `&model=${encodeURIComponent(model)}` : ''
  const form = new FormData()
  form.append('audio', audio)

  const res = await fetch(
    `${SERVICE_URLS.TRANSCRIPTION}/transcribe?language=${encodeURIComponent(language)}${modelParam}`,
    { method: 'POST', body: form },
  )
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 300)
    throw new Error(`Local whisper ${res.status}: ${detail}`)
  }
  const data = (await res.json()) as { text?: string }
  return (data.text ?? '').trim()
}

/**
 * Transcribe audio to text. Groq Whisper primary, local faster-whisper fallback.
 * @throws TranscriptionUnavailableError only if every provider failed.
 */
export async function transcribeAudio(
  audio: Blob,
  opts?: { language?: string; localModel?: string; filename?: string },
): Promise<TranscribeResult> {
  const language = opts?.language ?? 'de'
  const filename = opts?.filename ?? 'audio.webm'
  const groqSuitable = Boolean(process.env.GROQ_API_KEY) && audio.size <= GROQ_MAX_BYTES

  // 1. Groq Whisper — the prod path (no self-hosting required).
  if (groqSuitable) {
    try {
      const text = await transcribeViaGroq(audio, language, filename)
      return { text, provider: 'groq', model: GROQ_WHISPER_MODEL }
    } catch (error) {
      logger.warn('Groq transcription failed; falling back to local whisper', { error: String(error) })
    }
  }

  // 2. Self-hosted faster-whisper — dev, or files above Groq's size limit.
  try {
    const text = await transcribeViaLocal(audio, language, opts?.localModel)
    return { text, provider: 'local', model: opts?.localModel ?? 'base' }
  } catch (localError) {
    logger.error('All transcription providers failed', {
      groqTried: groqSuitable,
      audioBytes: audio.size,
      localError: String(localError),
    })
    // Message is user-facing (surfaced by the protocols UI) — say what the
    // user can actually DO, not which provider died.
    const sizeMb = Math.round(audio.size / 1024 / 1024)
    const maxMb = Math.round(GROQ_MAX_BYTES / 1024 / 1024)
    throw new TranscriptionUnavailableError(
      groqSuitable
        ? 'Transkription derzeit nicht verfügbar. Bitte später erneut versuchen oder den Text direkt einfügen.'
        : `Die Audiodatei ist zu gross für die Transkription (${sizeMb} MB, Maximum ${maxMb} MB). Bitte eine kürzere Aufnahme hochladen oder den Text direkt einfügen.`,
    )
  }
}
