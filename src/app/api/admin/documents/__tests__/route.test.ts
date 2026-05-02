/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/documents
 *
 * Mission-relevant: admin view of repairer documents. Three parallel queries
 * (application, documents, missing required types). applicationId is
 * required; application not found → 404.
 *
 * Behaviors locked:
 *   GET /api/admin/documents
 *   - returns 401 when not authenticated
 *   - returns 400 when applicationId is missing
 *   - returns 404 when application not found
 *   - returns 200 with documents, application, and missing required types
 *   - returns 500 when DB throws
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

const mockDbExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  repairerApplications: { id: 'ra_id' },
  users: { id: 'u_id' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'sql' }), { raw: jest.fn(), join: jest.fn() }),
  getTableName: jest.fn().mockReturnValue('mock_table'),
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: {
    VERIFICATION_DOCUMENTS: 'verification_documents',
    DOCUMENT_TYPES: 'document_types',
    USERS: 'users',
  },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (entity: string) =>
      NextResponse.json({ success: false, error: `${entity} nicht gefunden` }, { status: 404 }),
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
import { GET } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_APP_ROW = { id: 'app-1', name: 'Hans', email: 'hans@example.com', document_verification_status: 'pending' }

const MOCK_DOC_ROW = {
  id: 'doc-1',
  application_id: 'app-1',
  document_type_id: 'dt-1',
  document_type_name: 'Ausweis',
  document_type_description: 'Personalausweis',
  is_required: true,
  filename: 'ausweis.pdf',
  original_filename: 'Ausweis.pdf',
  file_path: '/uploads/ausweis.pdf',
  file_size_bytes: 102400,
  mime_type: 'application/pdf',
  status: 'pending',
  admin_notes: null,
  reviewed_by: null,
  reviewed_at: null,
  expires_at: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
}

function makeRequest(params: Record<string, string> = { applicationId: 'app-1' }) {
  const url = new URL('http://localhost/api/admin/documents')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  // Parallel: [application, documents, missingRequiredTypes]
  mockDbExecute
    .mockResolvedValueOnce({ rows: [MOCK_APP_ROW] })
    .mockResolvedValueOnce({ rows: [MOCK_DOC_ROW] })
    .mockResolvedValueOnce({ rows: [] })
})

// ============================================================================
// GET /api/admin/documents
// ============================================================================

describe('GET /api/admin/documents — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/documents — validation', () => {
  it('returns 400 when applicationId is missing', async () => {
    const response = await GET(makeRequest({}))
    expect(response.status).toBe(400)
  })
})

describe('GET /api/admin/documents — not found', () => {
  it('returns 404 when application not found', async () => {
    mockDbExecute.mockReset()
    mockDbExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
    const response = await GET(makeRequest())
    expect(response.status).toBe(404)
  })
})

describe('GET /api/admin/documents — success', () => {
  it('returns 200 with documents and application', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
  })

  it('returns mapped document and application data', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.documents).toHaveLength(1)
    expect(body.data.application).toBeDefined()
  })

  it('returns 500 when DB throws', async () => {
    mockDbExecute.mockReset()
    mockDbExecute.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
  })
})
