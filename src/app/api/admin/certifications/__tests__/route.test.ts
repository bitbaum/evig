/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/certifications
 *
 * Mission-relevant: admin view of repairer certifications. applicationId is
 * required — missing it returns 400 immediately. Both DB queries run in
 * parallel; application not found (second query empty) → 404.
 *
 * Behaviors locked:
 *   GET /api/admin/certifications
 *   - returns 401 when not authenticated
 *   - returns 400 when applicationId is missing
 *   - returns 400 when status filter is invalid
 *   - returns 404 when application not found
 *   - returns 200 with certifications and application
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

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'sql' }), { raw: jest.fn(), join: jest.fn() }),
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: {
    REPAIRER_CERTIFICATIONS: 'repairer_certifications',
    CERTIFICATION_TYPES: 'certification_types',
    REPAIRER_APPLICATIONS: 'repairer_applications',
    USERS: 'users',
  },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
}))

jest.mock('@/config/certification-status', () => ({
  CERTIFICATION_STATUS: {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
  },
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

const MOCK_CERT_ROW = {
  id: 'cert-1',
  application_id: 'app-1',
  certification_type_id: 'ct-1',
  certification_type_name: 'CompTIA A+',
  certification_type_description: 'PC Repair',
  category: 'hardware',
  custom_name: null,
  issuing_authority: 'CompTIA',
  default_issuing_authority: 'CompTIA',
  certification_number: 'CERT-001',
  issue_date: '2026-01-01',
  expiry_date: '2028-01-01',
  verification_status: 'pending',
  verification_method: 'manual',
  verification_result: null,
  admin_notes: null,
  verified_by: null,
  verified_at: null,
  document_path: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
}

const MOCK_APP_ROW = {
  id: 'app-1',
  name: 'Hans Müller',
  email: 'hans@example.com',
}

function makeRequest(params: Record<string, string> = { applicationId: 'app-1' }) {
  const url = new URL('http://localhost/api/admin/certifications')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  // parallel: [certifications, application]
  mockDbExecute
    .mockResolvedValueOnce({ rows: [MOCK_CERT_ROW] })
    .mockResolvedValueOnce({ rows: [MOCK_APP_ROW] })
})

// ============================================================================
// GET /api/admin/certifications
// ============================================================================

describe('GET /api/admin/certifications — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/certifications — validation', () => {
  it('returns 400 when applicationId is missing', async () => {
    const response = await GET(makeRequest({}))
    expect(response.status).toBe(400)
  })

  it('returns 400 when status filter is invalid', async () => {
    const response = await GET(makeRequest({ applicationId: 'app-1', status: 'invalid_status' }))
    expect(response.status).toBe(400)
  })
})

describe('GET /api/admin/certifications — not found', () => {
  it('returns 404 when application not found', async () => {
    mockDbExecute.mockReset()
    mockDbExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
    const response = await GET(makeRequest())
    expect(response.status).toBe(404)
  })
})

describe('GET /api/admin/certifications — success', () => {
  it('returns 200 with certifications and application', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
  })

  it('returns application info', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.application.applicantName).toBe('Hans Müller')
    expect(body.data.certifications).toHaveLength(1)
  })

  it('returns 500 when DB throws', async () => {
    mockDbExecute.mockReset()
    mockDbExecute.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
  })
})
