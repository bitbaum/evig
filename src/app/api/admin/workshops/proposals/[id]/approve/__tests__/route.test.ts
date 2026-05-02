/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/workshops/proposals/[id]/approve
 *
 * Behaviors locked:
 *   - returns 401 when not authenticated
 *   - returns 400 when action is invalid
 *   - returns 404 when proposal not found
 *   - returns 200 on reject action
 *   - returns 200 on approve action (runs transaction)
 */

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
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, resolvedContext)
      })
  },
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockTransaction = jest.fn()
const mockTxUpdate = jest.fn()
const mockTxSet = jest.fn()
const mockTxUpdateWhere = jest.fn()
const mockTxInsert = jest.fn()
const mockTxValues = jest.fn()
const mockTxReturning = jest.fn()
const mockSendEmail = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    transaction: (...args: unknown[]) => mockTransaction.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  workshopProposals: { id: 'wp_id', userId: 'wp_userId', title: 'wp_title', status: 'wp_status' },
  workshops: { id: 'w_id' },
  workshopInstances: { id: 'wi_id' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}))

jest.mock('@/config/approval-status', () => ({
  APPROVAL_STATUS: { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected', REQUIRES_CHANGES: 'requires_changes' },
}))

jest.mock('@/config/workshops', () => ({
  WORKSHOP_INSTANCE_STATUS: { SCHEDULED: 'scheduled' },
}))

jest.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_PROPOSAL = {
  id: 'prop-1', userId: 'u-1', title: 'Laptop Repair Workshop',
  description: 'Learn to fix laptops', shortDescription: 'Repair workshop',
  category: 'electronics', durationMinutes: 120, level: 'beginner',
  maxParticipants: 10, minParticipants: 3, priceCents: 2000,
  prerequisites: null, learningObjectives: null, targetAudience: null,
  materialsProvided: [], materialsRequired: [], proposedDate: null,
  proposedTime: null, selectedLocationId: null, proposedLocation: null,
  proposerName: 'Hans', proposerEmail: 'hans@example.com',
}

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/admin/workshops/proposals/prop-1/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeContext(id = 'prop-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockFrom.mockReturnValue({ leftJoin: mockLeftJoin })
  mockLeftJoin.mockReturnValue({ where: mockWhere })
  mockWhere.mockResolvedValue([MOCK_PROPOSAL])

  mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
    const tx = {
      update: (...args: unknown[]) => { mockTxUpdate(...args); return { set: mockTxSet } },
      insert: (...args: unknown[]) => { mockTxInsert(...args); return { values: mockTxValues } },
    }
    mockTxSet.mockReturnValue({ where: mockTxUpdateWhere })
    mockTxUpdateWhere.mockResolvedValue(undefined)
    mockTxValues.mockReturnValue({ returning: mockTxReturning })
    mockTxReturning.mockResolvedValue([{ id: 'w-new' }])
    return cb(tx)
  })

  mockSendEmail.mockResolvedValue({ success: true })
})

describe('POST /api/admin/workshops/proposals/[id]/approve — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest({ action: 'approve' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/workshops/proposals/[id]/approve — validation', () => {
  it('returns 400 when action is invalid', async () => {
    const response = await POST(makeRequest({ action: 'invalid' }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when proposal not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await POST(makeRequest({ action: 'reject' }), makeContext())
    expect(response.status).toBe(404)
  })
})

describe('POST /api/admin/workshops/proposals/[id]/approve — success', () => {
  it('returns 200 on reject action', async () => {
    const response = await POST(makeRequest({ action: 'reject', review_notes: 'Not good enough' }), makeContext())
    expect(response.status).toBe(200)
    expect(mockTransaction).toHaveBeenCalledTimes(1)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  it('returns 200 on approve action', async () => {
    const response = await POST(makeRequest({ action: 'approve' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.proposal.status).toBe('approved')
  })
})
