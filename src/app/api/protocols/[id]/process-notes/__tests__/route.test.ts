/**
 * @jest-environment node
 *
 * Tests for POST /api/protocols/[id]/process-notes
 *
 * This route processes meeting notes (JSON or free text) for a protocol.
 * Only draft/review protocols are editable; processing finalized records
 * would overwrite approved governance content.
 *
 * Behaviors locked:
 *   POST /api/protocols/[id]/process-notes
 *   - returns 401 when not authenticated
 *   - returns 400 when content is too short
 *   - returns 404 when protocol is not found
 *   - returns 400 when protocol status is not draft or review
 *   - returns 500 when processNotes returns { success: false }
 *   - returns 200 with processing result on success
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

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
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

// Schema mock — static, survives jest.resetAllMocks()
jest.mock('@/lib/schemas/protocols', () => ({
  processNotesSchema: {
    safeParse: (b: unknown) => {
      const body = b as Record<string, unknown>
      if (!body?.content || (body.content as string).length < 20) {
        return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } }
      }
      return { success: true, data: { content: body.content } }
    },
  },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    PROTOCOL_NOT_EDITABLE: 'Nicht bearbeitbar',
    NOTES_PROCESSING_FAILED: 'Notizen konnten nicht verarbeitet werden',
  },
}))

jest.mock('@/config/protocols', () => ({
  PROTOCOL_STATUSES: {
    DRAFT: 'draft',
    REVIEW: 'review',
  },
}))

const mockGetProtocolById = jest.fn()
const mockProcessNotes = jest.fn()

jest.mock('@/lib/services/protocols', () => ({
  getProtocolById: (...args: unknown[]) => mockGetProtocolById.apply(null, args),
  processNotes: (...args: unknown[]) => mockProcessNotes.apply(null, args),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
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

const MOCK_PROTOCOL = { id: 'proto-1', status: 'draft' }

const MOCK_PROCESS_RESULT = {
  success: true,
  model: 'claude-3-5-sonnet',
  source: 'ai',
}

// Exactly 20 characters — meets the minimum for processNotesSchema
const VALID_CONTENT = 'Protokollnotizen hier'

function makeRequest(body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/protocols/proto-1/process-notes', body !== undefined
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { method: 'POST' }
  )
}

function makeContext(id = 'proto-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' })
  mockIsSuperAdmin.mockReturnValue(false)
  mockGetProtocolById.mockResolvedValue(MOCK_PROTOCOL)
  mockProcessNotes.mockResolvedValue(MOCK_PROCESS_RESULT)
})

// ============================================================================
// POST — unauthenticated
// ============================================================================

describe('POST /api/protocols/[id]/process-notes — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest({ content: VALID_CONTENT }), makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// POST — validation
// ============================================================================

describe('POST /api/protocols/[id]/process-notes — validation', () => {
  it('returns 400 when content is too short', async () => {
    const response = await POST(makeRequest({ content: 'too short' }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when content is absent', async () => {
    const response = await POST(makeRequest({}), makeContext())
    expect(response.status).toBe(400)
  })

  it('does not call processNotes when validation fails', async () => {
    await POST(makeRequest({ content: 'too short' }), makeContext())
    expect(mockProcessNotes).not.toHaveBeenCalled()
  })
})

// ============================================================================
// POST — protocol checks
// ============================================================================

describe('POST /api/protocols/[id]/process-notes — protocol checks', () => {
  it('returns 404 when protocol is not found', async () => {
    mockGetProtocolById.mockResolvedValueOnce(null)
    const response = await POST(makeRequest({ content: VALID_CONTENT }), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when protocol status is finalized (not draft or review)', async () => {
    mockGetProtocolById.mockResolvedValueOnce({ id: 'proto-1', status: 'finalized' })
    const response = await POST(makeRequest({ content: VALID_CONTENT }), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Nicht bearbeitbar')
  })

  it('allows processing when status is review', async () => {
    mockGetProtocolById.mockResolvedValueOnce({ id: 'proto-1', status: 'review' })
    const response = await POST(makeRequest({ content: VALID_CONTENT }), makeContext())
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// POST — service errors
// ============================================================================

describe('POST /api/protocols/[id]/process-notes — service errors', () => {
  it('returns 500 when processNotes returns { success: false }', async () => {
    mockProcessNotes.mockResolvedValueOnce({ success: false, error: 'AI failed' })
    const response = await POST(makeRequest({ content: VALID_CONTENT }), makeContext())
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Notizen konnten nicht verarbeitet werden')
  })

  it('returns 500 when processNotes throws an unexpected error', async () => {
    mockProcessNotes.mockRejectedValueOnce(new Error('DB timeout'))
    const response = await POST(makeRequest({ content: VALID_CONTENT }), makeContext())
    expect(response.status).toBe(500)
  })
})

// ============================================================================
// POST — success
// ============================================================================

describe('POST /api/protocols/[id]/process-notes — success', () => {
  it('returns 200 with processing result', async () => {
    const response = await POST(makeRequest({ content: VALID_CONTENT }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.processed).toBe(true)
    expect(body.data.model).toBe('claude-3-5-sonnet')
    expect(body.data.source).toBe('ai')
  })

  it('passes protocolId and content to processNotes', async () => {
    await POST(makeRequest({ content: VALID_CONTENT }), makeContext('proto-99'))
    expect(mockProcessNotes).toHaveBeenCalledWith('proto-99', VALID_CONTENT)
  })
})
