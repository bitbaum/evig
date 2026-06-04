import { FILE_SIZE_LIMITS } from '@/config/limits'

export interface AudioFileLike {
  size: number
  type: string
  name: string
}
const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
])

export function validateAudioUpload(file: AudioFileLike): string | null {
  if (!file) return 'Bitte wähle eine Audiodatei aus.'

  if (file.size <= 0) {
    return 'Die Audiodatei ist leer.'
  }

  if (file.size > FILE_SIZE_LIMITS.AUDIO_MAX) {
    const maxMb = Math.round(FILE_SIZE_LIMITS.AUDIO_MAX / (1024 * 1024))
    return `Die Audiodatei ist zu gross (maximal ${maxMb} MB).`
  }

  if (file.type && !ALLOWED_AUDIO_MIME_TYPES.has(file.type)) {
    return 'Dateiformat nicht unterstützt. Bitte MP3, M4A, WAV, OGG oder WebM verwenden.'
  }

  const lowerName = file.name.toLowerCase()
  const hasKnownExtension = ['.mp3', '.m4a', '.wav', '.ogg', '.webm', '.mp4'].some(ext => lowerName.endsWith(ext))

  if (!file.type && !hasKnownExtension) {
    return 'Dateiformat nicht erkannt. Bitte eine Audiodatei hochladen.'
  }

  return null
}

export const AUDIO_UPLOAD_LIMITS = {
  maxSizeBytes: FILE_SIZE_LIMITS.AUDIO_MAX,
}
