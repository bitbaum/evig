/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/intake/extract-voice
 *
 * Behaviors locked:
 *   POST - 401, 400 (no audio), 400 (transcription fails), 400 (empty text), 200
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler
    return (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return (handler as (r: Request, s: unknown) => unknown)(req, session)
      })
  },
}))

const mockExtractProductFromText = jest.fn()
const mockFetch = jest.fn()

jest.mock('@/lib/erfassung/ai-extraction', () => ({
  extractProductFromText: (...args: unknown[]) => mockExtractProductFromText.apply(null, args),
}))

jest.mock('@/config/services', () => ({
  SERVICE_URLS: { TRANSCRIPTION: 'http://localhost:8000' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
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
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_EXTRACTION = {
  success: true,
  data: { produktname: 'Laptop', category: 'electronics' },
  metadata: { confidence: 0.9 },
  model: 'llama-3.3',
  sourceType: 'voice',
}

function makeAudioRequest(hasAudio = true) {
  const formData = new FormData()
  if (hasAudio) {
    const audioBlob = new Blob(['audio-data'], { type: 'audio/webm' })
    formData.append('audio', new File([audioBlob], 'recording.webm', { type: 'audio/webm' }))
  }
  return new NextRequest('http://localhost/api/admin/intake/extract-voice', {
    method: 'POST',
    body: formData,
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  global.fetch = mockFetch
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ text: 'Dell Latitude E7470 Laptop', language: 'de' }),
    text: async () => '',
  })

  mockExtractProductFromText.mockResolvedValue(MOCK_EXTRACTION)
})

describe('POST /api/admin/intake/extract-voice — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeAudioRequest())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/intake/extract-voice — validation', () => {
  it('returns 400 when no audio file provided', async () => {
    const response = await POST(makeAudioRequest(false))
    expect(response.status).toBe(400)
  })

  it('returns 500 when transcription service fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, text: async () => 'Error' })
    const response = await POST(makeAudioRequest())
    expect(response.status).toBe(500)
  })

  it('returns 400 when transcription returns empty text', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: '', language: 'de' }),
    })
    const response = await POST(makeAudioRequest())
    expect(response.status).toBe(400)
  })
})

describe('POST /api/admin/intake/extract-voice — success', () => {
  it('returns 200 with extraction data', async () => {
    const response = await POST(makeAudioRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.transcription).toBe('Dell Latitude E7470 Laptop')
    expect(body.data.data.produktname).toBe('Laptop')
  })
})
