/**
 * @jest-environment node
 *
 * Tests for GET/PATCH/DELETE /api/admin/donations/[id]
 *
 * Mission-relevant: donation records are financial data. `alias` is called at
 * module level — mock it as a static function so resetAllMocks() doesn't
 * break the module-level `recorder` alias.
 *
 * Behaviors locked:
 *   GET /api/admin/donations/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when not found
 *   - returns 200 with donation
 *
 *   PATCH /api/admin/donations/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 400 when no fields provided
 *   - returns 404 when not found
 *   - returns 200 on success
 *
 *   DELETE /api/admin/donations/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when not found
 *   - returns 200 on success
 *   - returns 500 when DB throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()
const mockUpdateSafeParse = jest.fn()

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

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  donations: { id: 'd_id', userId: 'd_userId', status: 'd_status', donationType: 'd_donationType', amountCents: 'd_amountCents', currency: 'd_currency', paymentMethod: 'd_paymentMethod', paymentReference: 'd_paymentReference', paymentDate: 'd_paymentDate', isRecurring: 'd_isRecurring', recurringFrequency: 'd_recurringFrequency', deviceCategory: 'd_deviceCategory', deviceDescription: 'd_deviceDescription', deviceBrand: 'd_deviceBrand', deviceModel: 'd_deviceModel', deviceCondition: 'd_deviceCondition', deviceAgeYears: 'd_deviceAgeYears', estimatedValueCents: 'd_estimatedValueCents', donorName: 'd_donorName', donorEmail: 'd_donorEmail', donorAddress: 'd_donorAddress', recordedBy: 'd_recordedBy', receiptRequested: 'd_receiptRequested', receiptSent: 'd_receiptSent', receiptSentAt: 'd_receiptSentAt', thankYouSent: 'd_thankYouSent', thankYouSentAt: 'd_thankYouSentAt', notes: 'd_notes', createdAt: 'd_createdAt', updatedAt: 'd_updatedAt' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

// alias must be static — resetAllMocks() would clear jest.fn() implementations
jest.mock('drizzle-orm/pg-core', () => ({
  alias: (_table: unknown, name: string) => ({ id: `${name}_id`, name: `${name}_name`, email: `${name}_email` }),
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'NOW()' }), { raw: jest.fn(), join: jest.fn() }),
}))

jest.mock('@/lib/schemas/donations', () => ({
  UpdateDonationSchema: {
    safeParse: (...args: unknown[]) => mockUpdateSafeParse.apply(null, args),
  },
  GetDonationsQuerySchema: {},
}))

jest.mock('@/config/donations', () => ({
  DONATION_STATUSES: { ARCHIVED: 'archived', PENDING: 'pending', CONFIRMED: 'confirmed', RECEIVED: 'received' },
  DONATION_TYPES: {},
  getEstimatedValue: jest.fn(),
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
import { GET, PATCH, DELETE } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_DONATION = {
  id: 'don-1',
  user_id: 'user-1',
  user_name: 'Hans',
  user_email: 'hans@example.com',
  donation_type: 'money',
  amount_cents: 5000,
  status: 'pending',
}

const MOCK_EXISTING = { id: 'don-1' }

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  const opts: RequestInit = { method }
  if (body) {
    opts.headers = { 'Content-Type': 'application/json' }
    opts.body = JSON.stringify(body)
  }
  return new NextRequest('http://localhost/api/admin/donations/don-1', opts)
}

function makeContext(id = 'don-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockFrom.mockReturnValue({ where: mockWhere, leftJoin: mockLeftJoin })
  mockLeftJoin.mockReturnValue({ where: mockWhere, leftJoin: mockLeftJoin })
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockWhere.mockResolvedValue([MOCK_DONATION])
  mockUpdateWhere.mockResolvedValue(undefined)
  mockUpdateSafeParse.mockReturnValue({ success: true, data: { status: 'confirmed' } })
})

// ============================================================================
// GET /api/admin/donations/[id]
// ============================================================================

describe('GET /api/admin/donations/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/donations/[id] — authenticated', () => {
  it('returns 200 with donation', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
  })

  it('returns the donation data', async () => {
    const response = await GET(makeRequest(), makeContext())
    const body = await response.json()
    expect(body.data.id).toBe('don-1')
  })

  it('returns 404 when donation not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })
})

// ============================================================================
// PATCH /api/admin/donations/[id]
// ============================================================================

describe('PATCH /api/admin/donations/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest('PATCH', { status: 'confirmed' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/admin/donations/[id] — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockUpdateSafeParse.mockReturnValueOnce({
      success: false,
      error: { flatten: () => ({ fieldErrors: { status: ['Ungültig'] } }) },
    })
    const response = await PATCH(makeRequest('PATCH', { status: 'invalid' }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when no fields provided', async () => {
    mockUpdateSafeParse.mockReturnValueOnce({ success: true, data: {} })
    const response = await PATCH(makeRequest('PATCH', {}), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/admin/donations/[id] — service errors', () => {
  it('returns 404 when donation not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await PATCH(makeRequest('PATCH', { status: 'confirmed' }), makeContext())
    expect(response.status).toBe(404)
  })
})

describe('PATCH /api/admin/donations/[id] — success', () => {
  it('returns 200 on success', async () => {
    mockWhere.mockResolvedValueOnce([MOCK_EXISTING])
    const response = await PATCH(makeRequest('PATCH', { status: 'confirmed' }), makeContext())
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// DELETE /api/admin/donations/[id]
// ============================================================================

describe('DELETE /api/admin/donations/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/admin/donations/[id] — service errors', () => {
  it('returns 404 when donation not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/admin/donations/[id] — success', () => {
  it('returns 200 on success', async () => {
    mockWhere.mockResolvedValueOnce([MOCK_EXISTING])
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(200)
  })

  it('returns 500 when DB throws', async () => {
    mockWhere.mockResolvedValueOnce([MOCK_EXISTING])
    mockUpdateWhere.mockRejectedValueOnce(new Error('DB error'))
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(500)
  })
})
