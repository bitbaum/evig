/**
 * Tests for src/lib/protocols/upload.ts — pure functions only.
 * Audio-side rules are tested in audio-validation tests; this file
 * exercises the new text + dispatch behaviour and the classifier.
 */

import {
  classifyFile,
  getAcceptString,
  validateTextUpload,
  validateUpload,
  PROTOCOL_UPLOAD_KIND,
  PROTOCOL_UPLOAD_LIMITS,
  TEXT_UPLOAD_LIMITS,
} from '../upload'

describe('classifyFile', () => {
  it('classifies audio by extension', () => {
    for (const name of ['rec.mp3', 'rec.m4a', 'rec.wav', 'rec.ogg', 'rec.webm', 'rec.flac', 'rec.mp4']) {
      expect(classifyFile({ name, type: '' })).toBe(PROTOCOL_UPLOAD_KIND.AUDIO)
    }
  })

  it('classifies text by extension', () => {
    for (const name of ['notes.txt', 'notes.md', 'notes.json']) {
      expect(classifyFile({ name, type: '' })).toBe(PROTOCOL_UPLOAD_KIND.TEXT)
    }
  })

  it('classifies by MIME when extension is unknown', () => {
    expect(classifyFile({ name: 'unknown.bin', type: 'audio/wav' })).toBe(PROTOCOL_UPLOAD_KIND.AUDIO)
    expect(classifyFile({ name: 'unknown.bin', type: 'text/plain' })).toBe(PROTOCOL_UPLOAD_KIND.TEXT)
    expect(classifyFile({ name: 'unknown.bin', type: 'application/json' })).toBe(PROTOCOL_UPLOAD_KIND.TEXT)
  })

  it('prefers extension over MIME (extension wins)', () => {
    // .mp3 with a text MIME (corrupt metadata) — should still be audio
    expect(classifyFile({ name: 'song.mp3', type: 'text/plain' })).toBe(PROTOCOL_UPLOAD_KIND.AUDIO)
  })

  it('returns null for unsupported types', () => {
    expect(classifyFile({ name: 'photo.png', type: 'image/png' })).toBeNull()
    expect(classifyFile({ name: 'doc.pdf', type: 'application/pdf' })).toBeNull()
    expect(classifyFile({ name: 'no-ext', type: '' })).toBeNull()
  })

  it('is case-insensitive on extension', () => {
    expect(classifyFile({ name: 'REC.MP3', type: '' })).toBe(PROTOCOL_UPLOAD_KIND.AUDIO)
    expect(classifyFile({ name: 'Notes.TXT', type: '' })).toBe(PROTOCOL_UPLOAD_KIND.TEXT)
  })
})

describe('getAcceptString', () => {
  it('contains both audio + text extensions', () => {
    const accept = getAcceptString()
    expect(accept).toContain('.mp3')
    expect(accept).toContain('.txt')
    expect(accept).toContain('.json')
  })

  it('is comma-separated with no spaces', () => {
    const accept = getAcceptString()
    expect(accept).not.toMatch(/,\s/)
    expect(accept.split(',').every((ext) => ext.startsWith('.'))).toBe(true)
  })
})

describe('validateTextUpload', () => {
  it('accepts a typical text file', () => {
    expect(validateTextUpload({ name: 'notes.txt', size: 2048 })).toBeNull()
  })

  it('rejects empty file', () => {
    expect(validateTextUpload({ name: 'empty.txt', size: 0 })).toMatch(/leer/)
  })

  it('rejects file larger than the cap', () => {
    expect(validateTextUpload({ name: 'big.txt', size: TEXT_UPLOAD_LIMITS.maxSizeBytes + 1 })).toMatch(/zu gross/)
  })

  it('accepts file exactly at the cap', () => {
    expect(validateTextUpload({ name: 'exact.txt', size: TEXT_UPLOAD_LIMITS.maxSizeBytes })).toBeNull()
  })
})

describe('validateUpload (kind dispatch)', () => {
  it('routes audio kind to audio validator (rejects invalid MIME)', () => {
    // audio validator catches MIME mismatch — text validator wouldn't
    const result = validateUpload(PROTOCOL_UPLOAD_KIND.AUDIO, {
      name: 'rec.unknown',
      size: 1024,
      type: 'application/octet-stream',
    })
    expect(result).not.toBeNull()
  })

  it('routes text kind to text validator', () => {
    const result = validateUpload(PROTOCOL_UPLOAD_KIND.TEXT, { name: 'n.txt', size: 1024 })
    expect(result).toBeNull()
  })
})

describe('PROTOCOL_UPLOAD_LIMITS', () => {
  it('exposes both audio and text size caps', () => {
    expect(PROTOCOL_UPLOAD_LIMITS.audioMaxBytes).toBeGreaterThan(0)
    expect(PROTOCOL_UPLOAD_LIMITS.textMaxBytes).toBeGreaterThan(0)
  })
})
