/**
 * @jest-environment node
 *
 * Tests for GET /api/locations (list with filtering) and POST /api/locations (create)
 *
 * Behaviors locked:
 *   GET  - 401, 200 (list), filter by status/type/city
 *   POST - 401, 400 (duplicate/validation), 201/200 (success + fire-and-forget email)
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: unknown) =>
    (req: Request, context?: { params?: Promise<unknown> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext)
      }),
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockOffset = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/db/schema', () => ({
  locations: {
    id: 'loc_id', name: 'loc_name', type: 'loc_type', description: 'loc_description',
    isApproved: 'loc_isApproved', approvalStatus: 'loc_approvalStatus',
    addressLine1: 'loc_addressLine1', addressLine2: 'loc_addressLine2',
    postalCode: 'loc_postalCode', city: 'loc_city', canton: 'loc_canton',
    country: 'loc_country', latitude: 'loc_latitude', longitude: 'loc_longitude',
    maxCapacity: 'loc_maxCapacity', facilities: 'loc_facilities',
    contactName: 'loc_contactName', contactPhone: 'loc_contactPhone',
    contactEmail: 'loc_contactEmail', createdBy: 'loc_createdBy',
    createdAt: 'loc_createdAt', updatedAt: 'loc_updatedAt',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  desc: (a: unknown) => ({ __desc: a }),
  ilike: (a: unknown, b: unknown) => ({ __ilike: [a, b] }),
  getTableColumns: () => ({
    id: 'loc_id', name: 'loc_name', type: 'loc_type', city: 'loc_city',
    isApproved: 'loc_isApproved', approvalStatus: 'loc_approvalStatus',
    createdAt: 'loc_createdAt',
  }),
}))

jest.mock('@/config/location-status', () => ({
  LOCATION_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    SUSPENDED: 'suspended',
  },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Internal server error',
    UNAUTHORIZED: 'Unauthorized',
  },
}))

const mockSendCustomEmail = jest.fn().mockResolvedValue(undefined)
const mockLocationSubmissionConfirmation = jest.fn().mockReturnValue({ subject: 'test', html: '<p>test</p>' })

jest.mock('@/lib/email', () => ({
  sendCustomEmail: (...args: unknown[]) => mockSendCustomEmail(...args),
  locationSubmissionConfirmation: (...args: unknown[]) => mockLocationSubmissionConfirmation(...args),
  sendEmail: jest.fn().mockResolvedValue(undefined),
}))

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  CreateLocationSchema: {},
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, details?: unknown) => NextResponse.json({ success: false, error: msg, details }, { status: 400 }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiForbidden: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiUnauthorized: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 401 }),
    parsePagination: (_req: unknown) => ({ limit: 20, offset: 0 }),
  
    hasMoreItems: (offset: number, limit: number, total: number) => offset + limit < total,}
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

const MOCK_SESSION = {
  user: {
    id: 'user-1',
    email: 'user@revamp-it.ch',
    name: 'Test User',
    isStaff: false,
    staffPermissions: [] as string[],
    isSuperAdmin: false,
  },
  expires: '2027-01-01',
}

const MOCK_LOCATION = {
  id: 'loc-1',
  name: 'RevampIT Zürich',
  type: 'workshop',
  city: 'Zürich',
  isApproved: true,
  approvalStatus: 'approved',
  createdAt: new Date('2026-01-01'),
  _total: '1',
}

const VALID_CREATE_BODY = {
  name: 'RevampIT Zürich',
  type: 'workshop',
  city: 'Zürich',
  address_line1: 'Teststrasse 1',
  postal_code: '8001',
}

function makeRequest(method = 'GET', body?: unknown, url = 'http://localhost/api/locations') {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockValidateBody.mockReturnValue({
    success: true,
    data: VALID_CREATE_BODY,
  })

  mockReturning.mockResolvedValue([MOCK_LOCATION])
  mockValues.mockReturnValue({ returning: mockReturning })

  // Default select chain — returns rows with _total
  // Note: route calls await db.select().from().where().orderBy().limit().offset(n)
  // so mockOffset itself must resolve to the array
  mockOffset.mockResolvedValue([MOCK_LOCATION])
  mockLimit.mockReturnValue({ offset: mockOffset })
  mockOrderBy.mockReturnValue({ limit: mockLimit, offset: mockOffset })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockFrom.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy })
  mockSelect.mockReturnValue({ from: mockFrom })

  mockSendCustomEmail.mockResolvedValue(undefined)
})

// ============================================================================
// GET /api/locations — unauthenticated
// ============================================================================

describe('GET /api/locations — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest('GET')
    const response = await GET(req)
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// GET /api/locations — success
// ============================================================================

describe('GET /api/locations — success', () => {
  it('returns 200 with location list', async () => {
    const req = makeRequest('GET')
    const response = await GET(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('locations')
    expect(body.data).toHaveProperty('pagination')
  })

  it('returns 200 when filtering by type', async () => {
    const req = makeRequest('GET', undefined, 'http://localhost/api/locations?type=workshop')
    const response = await GET(req)
    expect(response.status).toBe(200)
  })

  it('returns 200 when filtering by city', async () => {
    const req = makeRequest('GET', undefined, 'http://localhost/api/locations?city=Zürich')
    const response = await GET(req)
    expect(response.status).toBe(200)
  })

  it('returns 200 when filtering by status=pending', async () => {
    const req = makeRequest('GET', undefined, 'http://localhost/api/locations?status=pending')
    const response = await GET(req)
    expect(response.status).toBe(200)
  })

  it('returns empty list when no locations match', async () => {
    mockOffset.mockResolvedValueOnce([])
    const req = makeRequest('GET')
    const response = await GET(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.locations).toHaveLength(0)
    expect(body.data.pagination.total).toBe(0)
  })
})

// ============================================================================
// POST /api/locations — unauthenticated
// ============================================================================

describe('POST /api/locations — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest('POST', VALID_CREATE_BODY)
    const response = await POST(req)
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// POST /api/locations — validation
// ============================================================================

describe('POST /api/locations — validation', () => {
  it('returns 400 when body validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 }),
    })
    const req = makeRequest('POST', {})
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when duplicate location exists', async () => {
    // First select (duplicate check) returns an existing location
    mockWhere.mockReturnValueOnce(
      Promise.resolve([{ id: 'existing-loc' }])
    )
    const req = makeRequest('POST', VALID_CREATE_BODY)
    const response = await POST(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('ähnlicher Ort')
  })
})

// ============================================================================
// POST /api/locations — success
// ============================================================================

describe('POST /api/locations — success', () => {
  it('creates location and returns 200', async () => {
    // Duplicate check returns empty
    mockWhere.mockReturnValueOnce(Promise.resolve([]))
    const req = makeRequest('POST', VALID_CREATE_BODY)
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('location')
    expect(mockInsert).toHaveBeenCalled()
  })

  it('fires and forgets confirmation email when session has email', async () => {
    mockWhere.mockReturnValueOnce(Promise.resolve([]))
    const req = makeRequest('POST', VALID_CREATE_BODY)
    await POST(req)
    // Allow promise microtasks to flush
    await Promise.resolve()
    expect(mockSendCustomEmail).toHaveBeenCalled()
  })

  it('sets createdBy to session user id', async () => {
    mockWhere.mockReturnValueOnce(Promise.resolve([]))
    const req = makeRequest('POST', VALID_CREATE_BODY)
    await POST(req)
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: 'user-1' })
    )
  })
})
