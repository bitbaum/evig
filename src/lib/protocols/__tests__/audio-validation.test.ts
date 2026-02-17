import { validateAudioUpload } from '../audio-validation'

describe('validateAudioUpload', () => {
  it('accepts supported audio file', () => {
    expect(validateAudioUpload({
      size: 1024,
      type: 'audio/mpeg',
      name: 'aufnahme.mp3',
    })).toBeNull()
  })

  it('rejects oversized file', () => {
    expect(validateAudioUpload({
      size: 26 * 1024 * 1024,
      type: 'audio/mpeg',
      name: 'lange-aufnahme.mp3',
    })).toContain('maximal 25 MB')
  })

  it('rejects unsupported type', () => {
    expect(validateAudioUpload({
      size: 1024,
      type: 'application/pdf',
      name: 'notizen.pdf',
    })).toContain('Dateiformat nicht unterstützt')
  })
})
