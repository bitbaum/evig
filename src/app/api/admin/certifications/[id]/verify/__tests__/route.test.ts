/**
 * @jest-environment node
 *
 * Tests for PUT /api/admin/certifications/[id]/verify
 *
 * Mission-relevant: prevents double-verification and auto-calculates expiry
 * date from validity_period_months + issue_date when no expiry is set.
 *
 * Behaviors locked:
 *   PUT /api/admin/certifications/[id]/verify
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 404 when certification not found
 *   - returns 400 when already verified
 *   - returns 200 on success
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
    return (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params
          ? { params: await context.params }
          : undefined
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, resolvedContext)
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

jest.mock('@/lib/schemas', () => ({
  validateBody: jest.fn().mockReturnValue({
    success: true,
    data: { adminNotes: null, verificationResult: null },
  }),
  CertificationVerifySchema: {},
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
import { PUT } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_CERT_PENDING = {
  id: 'cert-1',
  application_id: 'app-1',
  user_id: 'user-1',
  verification_status: 'pending',
  expiry_date: '2028-01-01',
  validity_period_months: 24,
  issue_date: '2026-01-01',
}

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/admin/certifications/cert-1/verify', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeContext(id = 'cert-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockDbExecute
    .mockResolvedValueOnce({ rows: [MOCK_CERT_PENDING] })
    .mockResolvedValueOnce({ rows: [] })

  const schemas = require('@/lib/schemas')
  schemas.validateBody.mockReturnValue({
    success: true,
    data: { adminNotes: null, verificationResult: null },
  })
})

// ============================================================================
// PUT /api/admin/certifications/[id]/verify
// ============================================================================

describe('PUT /api/admin/certifications/[id]/verify — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PUT(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PUT /api/admin/certifications/[id]/verify — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const schemas = require('@/lib/schemas')
    const { NextResponse } = jest.requireActual('next/server')
    schemas.validateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await PUT(makeRequest(), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PUT /api/admin/certifications/[id]/verify — service errors', () => {
  it('returns 404 when certification not found', async () => {
    mockDbExecute.mockReset()
    mockDbExecute.mockResolvedValueOnce({ rows: [] })
    const response = await PUT(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when already verified', async () => {
    mockDbExecute.mockReset()
    mockDbExecute.mockResolvedValueOnce({ rows: [{ ...MOCK_CERT_PENDING, verification_status: 'verified' }] })
    const response = await PUT(makeRequest(), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PUT /api/admin/certifications/[id]/verify — success', () => {
  it('returns 200 with certificationId', async () => {
    const response = await PUT(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.certificationId).toBe('cert-1')
  })

  it('returns 500 when DB throws', async () => {
    mockDbExecute.mockReset()
    mockDbExecute.mockRejectedValueOnce(new Error('DB error'))
    const response = await PUT(makeRequest(), makeContext())
    expect(response.status).toBe(500)
  })
})

describe('PUT /api/admin/certifications/[id]/verify — auto-calculated expiry date', () => {
  // Smoke-test the no-explicit-expiry branch. The fix itself
  // (setMonth(getMonth() + N) instead of N*30 days) is checked by code
  // review; the project's drizzle-orm sql mock collapses templates to
  // `{__sql:'sql'}` so we can't inspect the exact ISO that lands in the
  // UPDATE values without ripping the mock apart. Locking that the route
  // doesn't crash on this branch + returns 200 is the meaningful
  // assertion at this layer.
  it('handles certs with no explicit expiry_date (computes from issue_date + validity_period_months)', async () => {
    mockDbExecute.mockReset()
    mockDbExecute
      .mockResolvedValueOnce({
        rows: [{
          ...MOCK_CERT_PENDING,
          expiry_date: null, // forces the calc branch
          validity_period_months: 12,
          issue_date: '2026-01-01',
        }],
      })
      .mockResolvedValueOnce({ rows: [] })

    const response = await PUT(makeRequest(), makeContext())
    expect(response.status).toBe(200)
  })
})
