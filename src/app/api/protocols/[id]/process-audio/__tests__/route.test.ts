/**
 * @jest-environment node
 *
 * Tests for POST /api/protocols/[id]/process-audio
 *
 * Behaviors locked:
 *   POST - 401, 400 (no audio), 400 (validation error), 404, 400 (wrong status),
 *          503 (transcription service fails), 422 (empty transcript),
 *          503 (AI processing fails retryable), 200
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (handler: (req: Request, session: unknown, ctx: unknown) => unknown) =>
    (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return handler(req, session, resolvedContext)
      }),
}))

const mockGetDbUserId = jest.fn()
jest.mock('@/lib/api/task-helpers', () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId.apply(null, args),
}))

const mockIsSuperAdmin = jest.fn()
jest.mock('@/lib/permissions', () => ({
  isSuperAdmin: (...args: unknown[]) => mockIsSuperAdmin.apply(null, args),
}))

const mockGetProtocolById = jest.fn()
const mockProcessTranscript = jest.fn()
jest.mock('@/lib/services/protocols', () => ({
  getProtocolById: (...args: unknown[]) => mockGetProtocolById.apply(null, args),
  processTranscript: (...args: unknown[]) => mockProcessTranscript.apply(null, args),
}))

const mockValidateAudioUpload = jest.fn()
jest.mock('@/lib/protocols/audio-validation', () => ({
  validateAudioUpload: (...args: unknown[]) => mockValidateAudioUpload.apply(null, args),
}))

jest.mock('@/config/transcription', () => ({
  WHISPER_MODELS: [{ id: 'large-v3', label: 'Large v3' }],
}))

jest.mock('@/config/services', () => ({
  SERVICE_URLS: { TRANSCRIPTION: 'http://localhost:5111' },
}))

jest.mock('@/config/protocols', () => ({
  PROTOCOL_STATUSES: { DRAFT: 'draft', REVIEW: 'review' },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    PROTOCOL_NOT_EDITABLE: 'Nicht bearbeitbar',
    PROCESSING_FAILED: 'Verarbeitung fehlgeschlagen',
    NO_AUDIO_RECEIVED: 'Keine Audiodatei empfangen',
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_PROTOCOL = { id: 'proto-1', title: 'Test Protocol', status: 'draft' }

function makeContext(id = 'proto-1') {
  return { params: Promise.resolve({ id }) }
}

function makeFormDataRequest(audioFile?: File | null) {
  const formData = new FormData()
  if (audioFile !== null) {
    const file = audioFile ?? new File(['audio content'], 'recording.mp3', { type: 'audio/mpeg' })
    formData.append('audio', file)
  }
  return new NextRequest('http://localhost/api/protocols/proto-1/process-audio', {
    method: 'POST',
    body: formData,
  })
}

const mockFetch = jest.fn()

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' })
  mockIsSuperAdmin.mockReturnValue(false)
  mockGetProtocolById.mockResolvedValue(MOCK_PROTOCOL)
  mockValidateAudioUpload.mockReturnValue(null)
  mockProcessTranscript.mockResolvedValue({ success: true, model: 'groq', code: undefined, retryable: undefined })
  global.fetch = mockFetch
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ text: 'Transkript des Meetings' }),
    text: async () => '',
  })
})

describe('POST /api/protocols/[id]/process-audio — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeFormDataRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/protocols/[id]/process-audio — validation', () => {
  it('returns 400 when no audio file provided', async () => {
    const formData = new FormData()
    const req = new NextRequest('http://localhost/api/protocols/proto-1/process-audio', {
      method: 'POST',
      body: formData,
    })
    const response = await POST(req, makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/audiodatei/i)
  })

  it('returns 400 when audio validation fails', async () => {
    mockValidateAudioUpload.mockReturnValueOnce('Dateiformat nicht unterstützt')
    const response = await POST(makeFormDataRequest(), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Dateiformat nicht unterstützt')
  })

  it('returns 404 when protocol not found', async () => {
    mockGetProtocolById.mockResolvedValueOnce(null)
    const response = await POST(makeFormDataRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when protocol status is finalized', async () => {
    mockGetProtocolById.mockResolvedValueOnce({ ...MOCK_PROTOCOL, status: 'finalized' })
    const response = await POST(makeFormDataRequest(), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('POST /api/protocols/[id]/process-audio — transcription failures', () => {
  it('returns 503 when transcription service fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => 'Service unavailable',
    })
    const response = await POST(makeFormDataRequest(), makeContext())
    expect(response.status).toBe(503)
    const body = await response.json()
    expect(body.code).toBe('TRANSCRIPTION_FAILED')
    expect(body.retryable).toBe(true)
  })

  it('returns 422 when transcription returns empty text', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: '   ' }),
      text: async () => '',
    })
    const response = await POST(makeFormDataRequest(), makeContext())
    expect(response.status).toBe(422)
    const body = await response.json()
    expect(body.code).toBe('EMPTY_TRANSCRIPTION')
  })
})

describe('POST /api/protocols/[id]/process-audio — AI processing failures', () => {
  it('returns 503 when processTranscript fails with retryable error', async () => {
    mockProcessTranscript.mockResolvedValueOnce({
      success: false,
      error: 'AI unavailable',
      code: 'AI_ERROR',
      retryable: true,
    })
    const response = await POST(makeFormDataRequest(), makeContext())
    expect(response.status).toBe(503)
    const body = await response.json()
    expect(body.code).toBe('AI_ERROR')
  })

  it('returns 422 when processTranscript fails with non-retryable error', async () => {
    mockProcessTranscript.mockResolvedValueOnce({
      success: false,
      error: 'Invalid content',
      code: 'INVALID',
      retryable: false,
    })
    const response = await POST(makeFormDataRequest(), makeContext())
    expect(response.status).toBe(422)
  })
})

describe('POST /api/protocols/[id]/process-audio — success', () => {
  it('returns 200 with processed result', async () => {
    const response = await POST(makeFormDataRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.processed).toBe(true)
    expect(body.data.model).toBe('groq')
    expect(body.data.transcriptLength).toBeGreaterThan(0)
  })

  it('calls transcription service and processTranscript with transcript text', async () => {
    await POST(makeFormDataRequest(), makeContext())
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/transcribe?language=de'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(mockProcessTranscript).toHaveBeenCalledWith('proto-1', 'Transkript des Meetings')
  })
})
