/**
 * Tests for transcribeAudio provider selection — especially the chunked
 * Groq path for files above the 24 MB upload cap (the prod incident of
 * 2026-07-16: a 63 MB meeting recording could never transcribe because
 * Groq rejects it and the local whisper service does not exist on prod).
 *
 * ffmpeg segmentation and network calls are mocked; the real ffmpeg
 * integration is exercised by the "Prod protocols smoke" workflow.
 */

import { transcribeAudio, TranscriptionUnavailableError } from '../transcribe'
import { isFfmpegAvailable, segmentAudioForTranscription } from '../segment-audio'

jest.mock('../segment-audio', () => ({
  isFfmpegAvailable: jest.fn(),
  segmentAudioForTranscription: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

const mockedFfmpegAvailable = jest.mocked(isFfmpegAvailable)
const mockedSegment = jest.mocked(segmentAudioForTranscription)

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'

function makeBlob(bytes: number): Blob {
  // Blob with a declared size — avoid actually allocating 60 MB in tests.
  return { size: bytes, arrayBuffer: async () => new ArrayBuffer(0), type: 'audio/mp4' } as unknown as Blob
}

function mockFetchGroqOk(texts: string[]) {
  let call = 0
  return jest.fn(async (url: string | URL | Request) => {
    if (String(url) !== GROQ_URL) throw new Error(`unexpected fetch: ${url}`)
    const text = texts[Math.min(call, texts.length - 1)]
    call += 1
    return {
      ok: true,
      json: async () => ({ text }),
    } as unknown as Response
  })
}

describe('transcribeAudio', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GROQ_API_KEY = 'test-key'
  })

  afterEach(() => {
    global.fetch = originalFetch
    delete process.env.GROQ_API_KEY
  })

  it('sends small files to Groq directly (no ffmpeg involved)', async () => {
    global.fetch = mockFetchGroqOk(['Hallo Sitzung']) as unknown as typeof fetch

    // Real Blob — it gets appended to FormData, which rejects fakes.
    const smallBlob = new Blob([new Uint8Array(1024)], { type: 'audio/mp4' })
    const result = await transcribeAudio(smallBlob, { filename: 'kurz.m4a' })

    expect(result).toMatchObject({ text: 'Hallo Sitzung', provider: 'groq' })
    expect(mockedSegment).not.toHaveBeenCalled()
  })

  it('chunks files above the Groq cap via ffmpeg and joins segment texts in order', async () => {
    mockedFfmpegAvailable.mockResolvedValue(true)
    mockedSegment.mockResolvedValue([
      { name: 'seg_000.mp3', data: Buffer.from('a') },
      { name: 'seg_001.mp3', data: Buffer.from('b') },
    ])
    const fetchMock = mockFetchGroqOk(['Erster Teil.', 'Zweiter Teil.'])
    global.fetch = fetchMock as unknown as typeof fetch

    const result = await transcribeAudio(makeBlob(63 * 1024 * 1024), { filename: 'lang.m4a' })

    expect(mockedSegment).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.provider).toBe('groq')
    expect(result.text).toBe('Erster Teil.\nZweiter Teil.')
  })

  it('fails with a user-actionable error when every provider is unavailable', async () => {
    mockedFfmpegAvailable.mockResolvedValue(false)
    // Local whisper service not reachable either.
    global.fetch = jest.fn(async () => {
      throw new Error('ECONNREFUSED')
    }) as unknown as typeof fetch

    await expect(
      transcribeAudio(makeBlob(63 * 1024 * 1024), { filename: 'lang.m4a' }),
    ).rejects.toThrow(TranscriptionUnavailableError)
    expect(mockedSegment).not.toHaveBeenCalled()
  })
})
