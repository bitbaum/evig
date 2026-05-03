/**
 * @jest-environment node
 *
 * Tests for POST /api/locations/[id]/approve — approve or reject a location
 * Note: uses auth() directly (not withAuth middleware).
 *
 * Behaviors locked:
 *   POST - 401 (unauthenticated), 403 (non-staff), 400 (invalid body), 404, 400 (invalid transition), 200
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockTransactionFn = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
    transaction: (...args: unknown[]) => mockTransactionFn(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  locations: {
    id: 'loc_id', name: 'loc_name', approvalStatus: 'loc_approvalStatus',
    createdBy: 'loc_createdBy', approvedBy: 'loc_approvedBy',
    approvedAt: 'loc_approvedAt', updatedAt: 'loc_updatedAt',
  },
  locationApprovals: {
    id: 'la_id', locationId: 'la_locationId', reviewerId: 'la_reviewerId',
    action: 'la_action', status: 'la_status', reviewNotes: 'la_reviewNotes',
    requiredChanges: 'la_requiredChanges',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
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

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  ApproveLocationSchema: {},
}))

const mockSendEmail = jest.fn().mockResolvedValue(undefined)

jest.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
  sendCustomEmail: jest.fn().mockResolvedValue(undefined),
  locationSubmissionConfirmation: jest.fn().mockReturnValue({}),
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
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_SESSION = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    isStaff: false,
    staffPermissions: [] as string[],
    isSuperAdmin: false,
  },
  expires: '2027-01-01',
}

const MOCK_STAFF_SESSION = {
  user: {
    id: 'staff-1',
    email: 'admin@revamp-it.ch',
    name: 'Staff User',
    isStaff: true,
    staffPermissions: ['*'] as string[],
    isSuperAdmin: true,
  },
  expires: '2027-01-01',
}

const MOCK_LOCATION = {
  id: 'loc-1',
  approvalStatus: 'pending',
  name: 'RevampIT Zürich',
  createdBy: 'user-2',
}

const MOCK_CREATOR = {
  name: 'Location Creator',
  email: 'creator@example.com',
}

function makeContext(id = 'loc-1') {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(body?: unknown) {
  return new NextRequest('http://localhost/api/locations/loc-1/approve', {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
  })
}

// Helper to set up transaction mock that runs the callback with a mock tx
function setupSuccessfulTransaction() {
  mockTransactionFn.mockImplementation(async (callback: (tx: unknown) => unknown) => {
    const mockTxUpdate = jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }) })
    const mockTxInsert = jest.fn().mockReturnValue({ values: jest.fn().mockResolvedValue(undefined) })
    return callback({ update: mockTxUpdate, insert: mockTxInsert })
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_STAFF_SESSION)

  mockValidateBody.mockReturnValue({
    success: true,
    data: { action: 'approve', review_notes: 'Looks good', required_changes: [] },
  })

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)
  mockValues.mockResolvedValue(undefined)
  mockSendEmail.mockResolvedValue(undefined)

  setupSuccessfulTransaction()

  // Default select: first call → location, second call → creator
  // Using mockImplementation so individual tests can override with mockResolvedValueOnce
  let dbSelectCallCount = 0
  mockSelect.mockImplementation(() => {
    dbSelectCallCount++
    const mockLocWhere = jest.fn().mockResolvedValue(
      dbSelectCallCount === 1 ? [MOCK_LOCATION] : [MOCK_CREATOR]
    )
    return { from: jest.fn().mockReturnValue({ where: mockLocWhere }) }
  })
  mockFrom.mockReturnValue({ where: mockWhere })
  mockWhere.mockResolvedValue([MOCK_LOCATION])
})

// ============================================================================
// POST /api/locations/[id]/approve — unauthenticated
// ============================================================================

describe('POST /api/locations/[id]/approve — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest({ action: 'approve' })
    const response = await POST(req, makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// POST /api/locations/[id]/approve — forbidden
// ============================================================================

describe('POST /api/locations/[id]/approve — forbidden', () => {
  it('returns 403 when user is not staff', async () => {
    mockAuth.mockResolvedValueOnce(MOCK_SESSION)
    const req = makeRequest({ action: 'approve' })
    const response = await POST(req, makeContext())
    expect(response.status).toBe(403)
  })
})

// ============================================================================
// POST /api/locations/[id]/approve — validation
// ============================================================================

describe('POST /api/locations/[id]/approve — validation', () => {
  it('returns 400 when body validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 }),
    })
    const req = makeRequest({})
    const response = await POST(req, makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when location does not exist', async () => {
    // Override mockSelect so first call returns empty (location not found)
    mockSelect.mockImplementationOnce(() => {
      const mockLocWhere = jest.fn().mockResolvedValue([])
      return { from: jest.fn().mockReturnValue({ where: mockLocWhere }) }
    })
    const req = makeRequest({ action: 'approve' })
    const response = await POST(req, makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 for invalid status transition (e.g. reject approved location)', async () => {
    // Override mockSelect so first call returns approved location
    mockSelect.mockImplementationOnce(() => {
      const mockLocWhere = jest.fn().mockResolvedValue([{ ...MOCK_LOCATION, approvalStatus: 'approved' }])
      return { from: jest.fn().mockReturnValue({ where: mockLocWhere }) }
    })
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { action: 'reject', review_notes: null, required_changes: [] },
    })
    const req = makeRequest({ action: 'reject' })
    const response = await POST(req, makeContext())
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// POST /api/locations/[id]/approve — success
// ============================================================================

describe('POST /api/locations/[id]/approve — success', () => {
  it('returns 200 when approving a pending location', async () => {
    const req = makeRequest({ action: 'approve' })
    const response = await POST(req, makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.location.status).toBe('approved')
    expect(mockTransactionFn).toHaveBeenCalled()
  })

  it('returns 200 when rejecting a pending location', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { action: 'reject', review_notes: 'Not suitable', required_changes: [] },
    })
    const req = makeRequest({ action: 'reject' })
    const response = await POST(req, makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.location.status).toBe('rejected')
  })

  it('sends email notification to creator', async () => {
    const req = makeRequest({ action: 'approve' })
    await POST(req, makeContext())
    expect(mockSendEmail).toHaveBeenCalled()
  })
})
