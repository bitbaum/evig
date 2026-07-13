import { validateAudioUpload } from '../audio-validation'
import { FILE_SIZE_LIMITS } from '@/config/limits'

describe('validateAudioUpload', () => {
  it('accepts supported audio file', () => {
    expect(validateAudioUpload({
      size: 1024,
      type: 'audio/mpeg',
      name: 'aufnahme.mp3',
    })).toBeNull()
  })

  it('rejects oversized file', () => {
    // Derive from the config SSOT so the test tracks the real limit, not a
    // hardcoded MB value that drifts when AUDIO_MAX changes.
    const maxMb = Math.round(FILE_SIZE_LIMITS.AUDIO_MAX / (1024 * 1024))
    expect(validateAudioUpload({
      size: FILE_SIZE_LIMITS.AUDIO_MAX + 1,
      type: 'audio/mpeg',
      name: 'lange-aufnahme.mp3',
    })).toContain(`maximal ${maxMb} MB`)
  })

  it('rejects unsupported type', () => {
    expect(validateAudioUpload({
      size: 1024,
      type: 'application/pdf',
      name: 'notizen.pdf',
    })).toContain('Dateiformat nicht unterstützt')
  })
})
