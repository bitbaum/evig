/**
 * @jest-environment node
 *
 * Tests for GET/PATCH/DELETE /api/protocols/[id]
 *
 * Mission-relevant: protocols are governance records for the non-profit.
 * GET is admin-accessible; PATCH requires editability check; DELETE gates
 * on creator or super-admin — wrong behavior here loses irreplaceable records.
 *
 * Behaviors locked:
 *   GET /api/protocols/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when protocol not found
 *   - returns 200 with protocol data
 *
 *   PATCH /api/protocols/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 on invalid body
 *   - returns 404 when protocol not found
 *   - returns 400 when PROTOCOL_NOT_EDITABLE error thrown
 *   - returns 200 with updated protocol
 *
 *   DELETE /api/protocols/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when deleteProtocol returns { error: 'not_found' }
 *   - returns 400 when deleteProtocol returns { error: 'forbidden' }
 *   - returns 200 with { deleted: true }
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

// withAdmin mock WITH context support (params are a Promise in Next.js 15)
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
const mockUpdateProtocol = jest.fn()
const mockDeleteProtocol = jest.fn()

jest.mock('@/lib/services/protocols', () => ({
  getProtocolById: (...args: unknown[]) => mockGetProtocolById.apply(null, args),
  updateProtocol: (...args: unknown[]) => mockUpdateProtocol.apply(null, args),
  deleteProtocol: (...args: unknown[]) => mockDeleteProtocol.apply(null, args),
}))

// Schema mock — static, survives jest.resetAllMocks()
jest.mock('@/lib/schemas/protocols', () => ({
  updateProtocolSchema: {
    safeParse: (body: unknown) => {
      const b = body as Record<string, unknown>
      if (!b?.title && !b?.status) {
        return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } }
      }
      return { success: true, data: b }
    },
  },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    PROTOCOL_NOT_EDITABLE: 'Protokoll kann nicht bearbeitet werden',
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
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
import { GET, PATCH, DELETE } from '../route'

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

const MOCK_PROTOCOL = {
  id: 'proto-1',
  title: 'Sitzungsprotokoll März',
  status: 'draft',
  content: 'Traktanden...',
}

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/protocols/proto-1', body
    ? { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { method: method }
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
  mockUpdateProtocol.mockResolvedValue(MOCK_PROTOCOL)
  mockDeleteProtocol.mockResolvedValue({ success: true })
})

// ============================================================================
// GET /api/protocols/[id]
// ============================================================================

describe('GET /api/protocols/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/protocols/[id] — authenticated', () => {
  it('returns 200 with protocol data', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('proto-1')
    expect(body.data.title).toBe('Sitzungsprotokoll März')
  })

  it('returns 404 when protocol not found', async () => {
    mockGetProtocolById.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('passes protocolId, dbUserId, and isAdmin to getProtocolById', async () => {
    mockIsSuperAdmin.mockReturnValue(true)
    await GET(makeRequest(), makeContext('proto-42'))
    expect(mockGetProtocolById).toHaveBeenCalledWith('proto-42', 'db-user-1', true)
  })
})

// ============================================================================
// PATCH /api/protocols/[id]
// ============================================================================

describe('PATCH /api/protocols/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest('PATCH', { title: 'Updated' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/protocols/[id] — validation', () => {
  it('returns 400 when body has no valid fields', async () => {
    const response = await PATCH(makeRequest('PATCH', {}), makeContext())
    expect(response.status).toBe(400)
  })

  it('does not call updateProtocol when validation fails', async () => {
    await PATCH(makeRequest('PATCH', {}), makeContext())
    expect(mockUpdateProtocol).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/protocols/[id] — service errors', () => {
  it('returns 404 when protocol not found', async () => {
    mockUpdateProtocol.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest('PATCH', { title: 'Updated' }), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when PROTOCOL_NOT_EDITABLE error is thrown', async () => {
    mockUpdateProtocol.mockRejectedValueOnce(new Error('PROTOCOL_NOT_EDITABLE'))
    const response = await PATCH(makeRequest('PATCH', { title: 'Updated' }), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Protokoll kann nicht bearbeitet werden')
  })

  it('returns 500 when service throws an unexpected error', async () => {
    mockUpdateProtocol.mockRejectedValueOnce(new Error('DB connection lost'))
    const response = await PATCH(makeRequest('PATCH', { title: 'Updated' }), makeContext())
    expect(response.status).toBe(500)
  })
})

describe('PATCH /api/protocols/[id] — success', () => {
  it('returns 200 with updated protocol', async () => {
    const response = await PATCH(makeRequest('PATCH', { title: 'Updated' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('proto-1')
  })

  it('passes protocolId, parsed data, and dbUserId to updateProtocol', async () => {
    await PATCH(makeRequest('PATCH', { title: 'New Title' }), makeContext('proto-99'))
    expect(mockUpdateProtocol).toHaveBeenCalledWith(
      'proto-99',
      expect.objectContaining({ title: 'New Title' }),
      'db-user-1'
    )
  })
})

// ============================================================================
// DELETE /api/protocols/[id]
// ============================================================================

describe('DELETE /api/protocols/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/protocols/[id] — service errors', () => {
  it('returns 404 when deleteProtocol returns { error: "not_found" }', async () => {
    mockDeleteProtocol.mockResolvedValueOnce({ error: 'not_found' })
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when deleteProtocol returns { error: "forbidden" }', async () => {
    mockDeleteProtocol.mockResolvedValueOnce({ error: 'forbidden' })
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/Berechtigung/)
  })

  it('returns 400 when deleteProtocol returns any non-not_found error', async () => {
    mockDeleteProtocol.mockResolvedValueOnce({ error: 'not_creator' })
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 500 when service throws', async () => {
    mockDeleteProtocol.mockRejectedValueOnce(new Error('DB error'))
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(500)
  })
})

describe('DELETE /api/protocols/[id] — success', () => {
  it('returns 200 with { deleted: true }', async () => {
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.deleted).toBe(true)
  })

  it('passes protocolId, dbUserId, and isAdmin to deleteProtocol', async () => {
    mockIsSuperAdmin.mockReturnValue(true)
    await DELETE(makeRequest('DELETE'), makeContext('proto-77'))
    expect(mockDeleteProtocol).toHaveBeenCalledWith('proto-77', 'db-user-1', true)
  })
})
