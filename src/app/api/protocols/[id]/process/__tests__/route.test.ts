/**
 * @jest-environment node
 *
 * Tests for POST /api/protocols/[id]/process
 *
 * Mission-relevant: AI transcript processing is the primary data-entry path
 * for governance records. Incorrect status guards or retryable-error handling
 * leads to duplicate processing or lost work.
 *
 * Behaviors locked:
 *   POST /api/protocols/[id]/process
 *   - returns 401 when not authenticated
 *   - returns 400 when raw_transcript is too short (schema validation fails)
 *   - returns 404 when protocol not found
 *   - returns 400 when protocol status is not draft or review
 *   - returns 503 when processTranscript returns retryable failure
 *   - returns 200 with { processed: true, model } on success
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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

jest.mock('@/lib/schemas/protocols', () => ({
  processTranscriptSchema: {
    safeParse: (b: unknown) => {
      const body = b as Record<string, unknown>
      if (!body?.raw_transcript || (body.raw_transcript as string).length < 10) {
        return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } }
      }
      return { success: true, data: { raw_transcript: body.raw_transcript } }
    },
  },
}))

const mockGetProtocolById = jest.fn()
const mockProcessTranscript = jest.fn()

jest.mock('@/lib/services/protocols', () => ({
  getProtocolById: (...args: unknown[]) => mockGetProtocolById.apply(null, args),
  processTranscript: (...args: unknown[]) => mockProcessTranscript.apply(null, args),
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    TRANSCRIPT_TOO_SHORT: 'Transkript zu kurz',
    PROTOCOL_NOT_EDITABLE: 'Nicht bearbeitbar',
    PROCESSING_FAILED: 'Verarbeitung fehlgeschlagen',
  },
}))

jest.mock('@/config/protocols', () => ({
  PROTOCOL_STATUSES: {
    DRAFT: 'draft',
    REVIEW: 'review',
    FINALIZED: 'finalized',
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

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ADMIN_SESSION = {
  user: {
    id: 'user-1',
    email: 'admin@revamp-it.ch',
    name: 'Admin',
    isStaff: true,
    staffPermissions: ['*'] as string[],
    isSuperAdmin: true,
  },
  expires: '2027-01-01',
}

const MOCK_PROTOCOL = { id: 'proto-1', title: 'Test Protocol', status: 'draft' }

function makeContext(id = 'proto-1') {
  return { params: Promise.resolve({ id }) }
}

function makePostRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/protocols/proto-1/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = { raw_transcript: 'This is a valid transcript longer than ten chars.' }

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(ADMIN_SESSION)
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' })
  mockIsSuperAdmin.mockReturnValue(false)
  mockGetProtocolById.mockResolvedValue(MOCK_PROTOCOL)
  mockProcessTranscript.mockResolvedValue({ success: true, model: 'groq' })
})

// ============================================================================
// POST /api/protocols/[id]/process — unauthenticated
// ============================================================================

describe('POST /api/protocols/[id]/process — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest(VALID_BODY), makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// POST /api/protocols/[id]/process — validation
// ============================================================================

describe('POST /api/protocols/[id]/process — validation', () => {
  it('returns 400 when raw_transcript is too short', async () => {
    const response = await POST(makePostRequest({ raw_transcript: 'short' }), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('Transkript zu kurz')
  })

  it('returns 400 when raw_transcript is missing', async () => {
    const response = await POST(makePostRequest({}), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

// ============================================================================
// POST /api/protocols/[id]/process — not found
// ============================================================================

describe('POST /api/protocols/[id]/process — not found', () => {
  it('returns 404 when protocol does not exist', async () => {
    mockGetProtocolById.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest(VALID_BODY), makeContext())
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

// ============================================================================
// POST /api/protocols/[id]/process — status guard
// ============================================================================

describe('POST /api/protocols/[id]/process — status guard', () => {
  it('returns 400 when protocol status is finalized (not draft or review)', async () => {
    mockGetProtocolById.mockResolvedValueOnce({ ...MOCK_PROTOCOL, status: 'finalized' })
    const response = await POST(makePostRequest(VALID_BODY), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('Nicht bearbeitbar')
  })

  it('accepts draft status', async () => {
    mockGetProtocolById.mockResolvedValueOnce({ ...MOCK_PROTOCOL, status: 'draft' })
    const response = await POST(makePostRequest(VALID_BODY), makeContext())
    expect(response.status).toBe(200)
  })

  it('accepts review status', async () => {
    mockGetProtocolById.mockResolvedValueOnce({ ...MOCK_PROTOCOL, status: 'review' })
    const response = await POST(makePostRequest(VALID_BODY), makeContext())
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// POST /api/protocols/[id]/process — processing failure
// ============================================================================

describe('POST /api/protocols/[id]/process — processing failure', () => {
  it('returns 503 when processTranscript returns retryable failure', async () => {
    mockProcessTranscript.mockResolvedValueOnce({
      success: false,
      retryable: true,
      error: 'AI unavailable',
      code: 'AI_ERROR',
    })
    const response = await POST(makePostRequest(VALID_BODY), makeContext())
    expect(response.status).toBe(503)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('AI unavailable')
    expect(body.code).toBe('AI_ERROR')
    expect(body.retryable).toBe(true)
  })

  it('returns 422 when processTranscript returns non-retryable failure', async () => {
    mockProcessTranscript.mockResolvedValueOnce({
      success: false,
      retryable: false,
      error: 'Invalid transcript',
      code: 'PARSE_ERROR',
    })
    const response = await POST(makePostRequest(VALID_BODY), makeContext())
    expect(response.status).toBe(422)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.retryable).toBe(false)
  })
})

// ============================================================================
// POST /api/protocols/[id]/process — success
// ============================================================================

describe('POST /api/protocols/[id]/process — success', () => {
  it('returns 200 with processed: true and model', async () => {
    const response = await POST(makePostRequest(VALID_BODY), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.processed).toBe(true)
    expect(body.data.model).toBe('groq')
  })

  it('calls processTranscript with protocol id and transcript', async () => {
    await POST(makePostRequest(VALID_BODY), makeContext())
    expect(mockProcessTranscript).toHaveBeenCalledWith(
      'proto-1',
      VALID_BODY.raw_transcript,
    )
  })
})
