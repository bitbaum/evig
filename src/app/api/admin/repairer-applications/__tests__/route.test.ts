/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/repairer-applications
 *
 * Behaviors locked:
 *   GET /api/admin/repairer-applications
 *   - returns 401 when not authenticated
 *   - returns 400 when status filter is invalid
 *   - returns 200 with applications and pagination
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
  repairerApplications: {},
  users: {},
}))

jest.mock('drizzle-orm', () => ({
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  getTableName: (_table: unknown) => 'mock_table',
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}))

jest.mock('@/config/approval-status', () => ({
  APPROVAL_STATUS: { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected', REQUIRES_CHANGES: 'requires_changes' },
}))

jest.mock('@/config/document-status', () => ({
  DOCUMENT_STATUS: { PENDING: 'pending' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    parsePagination: jest.fn().mockReturnValue({ limit: 20, offset: 0 }),
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

const MOCK_ROW = {
  id: 'app-1', user_id: 'u-1', applicant_name: 'Hans', applicant_email: 'hans@example.com',
  business_name: 'Hans Repairs', business_type: 'freelance', description: 'Laptop repair',
  years_experience: 5, phone: '079 123 45 67', website: null, address: 'Bahnhofstrasse 1',
  city: 'Zürich', postal_code: '8001', service_radius_km: 10, remote_services: true,
  hourly_rate_cents: 8000, emergency_fee_cents: 2000, home_visit_fee_cents: 1500,
  services_offered: ['laptop'], specializations: [], certifications: [],
  insurance_info: null, portfolio_images: [], verification_documents: [],
  terms_accepted: true, status: 'pending', document_verification_status: 'pending',
  admin_notes: null, reviewed_by: null, reviewed_at: null,
  created_at: '2026-01-01', updated_at: '2026-01-01', user_created_at: '2025-01-01',
  _total_count: '1',
}

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/repairer-applications')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString(), { method: 'GET' })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockDbExecute.mockResolvedValue({ rows: [MOCK_ROW] })

  const helpers = require('@/lib/api/helpers')
  helpers.parsePagination.mockReturnValue({ limit: 20, offset: 0 })
})

// ============================================================================
// GET /api/admin/repairer-applications
// ============================================================================

describe('GET /api/admin/repairer-applications — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/repairer-applications — validation', () => {
  it('returns 400 when status filter is invalid', async () => {
    const response = await GET(makeRequest({ status: 'invalid_status' }))
    expect(response.status).toBe(400)
  })
})

describe('GET /api/admin/repairer-applications — authenticated', () => {
  it('returns 200 with applications and pagination', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.applications).toHaveLength(1)
    expect(body.data.applications[0].applicantName).toBe('Hans')
    expect(body.data.total).toBe(1)
  })

  it('returns 500 when DB throws', async () => {
    mockDbExecute.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
  })
})
