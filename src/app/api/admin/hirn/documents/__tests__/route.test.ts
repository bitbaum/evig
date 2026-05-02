/**
 * @jest-environment node
 *
 * Tests for GET/DELETE /api/admin/hirn/documents
 *
 * Behaviors locked:
 *   GET /api/admin/hirn/documents
 *   - returns 401 when not authenticated
 *   - returns 200 with ingestion stats when stats=true
 *   - returns 200 with document list
 *   - returns 500 when service throws
 *
 *   DELETE /api/admin/hirn/documents
 *   - returns 401 when not authenticated
 *   - returns 403 when user is not super admin
 *   - returns 400 when document id is missing
 *   - returns 200 on success
 *   - returns 500 when service throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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

const mockListDocuments = jest.fn()
const mockDeleteDocument = jest.fn()
const mockGetIngestionStats = jest.fn()

jest.mock('@/lib/hirn', () => ({
  listDocuments: (...args: unknown[]) => mockListDocuments.apply(null, args),
  deleteDocument: (...args: unknown[]) => mockDeleteDocument.apply(null, args),
  getIngestionStats: (...args: unknown[]) => mockGetIngestionStats.apply(null, args),
}))

const mockIsSuperAdmin = jest.fn()

jest.mock('@/lib/permissions', () => ({
  isSuperAdmin: (...args: unknown[]) => mockIsSuperAdmin.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiForbidden: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    parsePagination: jest.fn().mockReturnValue({ limit: 20, offset: 0 }),
  }
})

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, DELETE } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_DOCUMENTS = [
  { id: 'doc-1', title: 'Reparatur Guide', sourceType: 'manual' },
  { id: 'doc-2', title: 'FAQ', sourceType: 'web' },
]

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/hirn/documents')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString(), { method: 'GET' })
}

function makeDeleteRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/hirn/documents')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString(), { method: 'DELETE' })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockListDocuments.mockResolvedValue({ documents: MOCK_DOCUMENTS, total: 2 })
  mockDeleteDocument.mockResolvedValue(undefined)
  mockGetIngestionStats.mockResolvedValue({ totalDocuments: 5, totalChunks: 42 })
  mockIsSuperAdmin.mockReturnValue(true)

  const helpers = require('@/lib/api/helpers')
  helpers.parsePagination.mockReturnValue({ limit: 20, offset: 0 })
})

// ============================================================================
// GET /api/admin/hirn/documents
// ============================================================================

describe('GET /api/admin/hirn/documents — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/hirn/documents — authenticated', () => {
  it('returns 200 with ingestion stats when stats=true', async () => {
    const response = await GET(makeGetRequest({ stats: 'true' }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.totalDocuments).toBe(5)
    expect(mockListDocuments).not.toHaveBeenCalled()
  })

  it('returns 200 with document list', async () => {
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.documents).toHaveLength(2)
    expect(body.data.total).toBe(2)
  })

  it('returns 500 when service throws', async () => {
    mockListDocuments.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(500)
  })
})

// ============================================================================
// DELETE /api/admin/hirn/documents
// ============================================================================

describe('DELETE /api/admin/hirn/documents — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeDeleteRequest({ id: 'doc-1' }))
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/admin/hirn/documents — authorization', () => {
  it('returns 403 when user is not super admin', async () => {
    mockIsSuperAdmin.mockReturnValueOnce(false)
    const response = await DELETE(makeDeleteRequest({ id: 'doc-1' }))
    expect(response.status).toBe(403)
  })
})

describe('DELETE /api/admin/hirn/documents — validation', () => {
  it('returns 400 when document id is missing', async () => {
    const response = await DELETE(makeDeleteRequest())
    expect(response.status).toBe(400)
  })
})

describe('DELETE /api/admin/hirn/documents — success', () => {
  it('returns 200 on success', async () => {
    const response = await DELETE(makeDeleteRequest({ id: 'doc-1' }))
    expect(response.status).toBe(200)
    expect(mockDeleteDocument).toHaveBeenCalledWith('doc-1')
  })

  it('returns 500 when service throws', async () => {
    mockDeleteDocument.mockRejectedValueOnce(new Error('DB error'))
    const response = await DELETE(makeDeleteRequest({ id: 'doc-1' }))
    expect(response.status).toBe(500)
  })
})
