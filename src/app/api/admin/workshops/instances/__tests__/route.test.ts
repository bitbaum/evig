/**
 * @jest-environment node
 *
 * Tests for GET/POST /api/admin/workshops/instances
 *
 * Behaviors locked:
 *   GET /api/admin/workshops/instances
 *   - returns 401 when not authenticated
 *   - returns 200 with instances and pagination
 *
 *   POST /api/admin/workshops/instances
 *   - returns 401 when not authenticated
 *   - returns 400 when required fields missing
 *   - returns 400 when workshop not found
 *   - returns 200 on success
 */

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

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockGroupBy = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockOffset = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/db/schema', () => ({
  workshopInstances: { id: 'wi_id', workshopId: 'wi_workshopId', startDate: 'wi_startDate', endDate: 'wi_endDate', location: 'wi_location', instructor: 'wi_instructor', maxParticipants: 'wi_maxP', notes: 'wi_notes', status: 'wi_status', createdAt: 'wi_createdAt', updatedAt: 'wi_updatedAt' },
  workshops: { id: 'w_id', title: 'w_title', slug: 'w_slug', maxParticipants: 'w_maxP' },
  workshopRegistrations: { id: 'wr_id', workshopInstanceId: 'wr_instanceId', status: 'wr_status' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  gt: (a: unknown, b: unknown) => ({ __gt: [a, b] }),
  desc: (col: unknown) => ({ __desc: col }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/workshop-registration-status', () => ({
  WORKSHOP_REGISTRATION_STATUS: { CONFIRMED: 'confirmed', PENDING: 'pending' },
}))

jest.mock('@/config/workshops', () => ({
  WORKSHOP_INSTANCE_STATUS: { SCHEDULED: 'scheduled' },
}))

jest.mock('@/config/org', () => ({
  ORG: { name: 'Revamp-IT' },
  LOCATIONS: { store: { full: 'Bahnhofstrasse 1, Zürich' } },
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

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_INSTANCE = { id: 'inst-1', workshop_title: 'Laptop Repair', current_participants: '3', confirmed_count: '2', pending_count: '1' }

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/workshops/instances', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  const helpers = require('@/lib/api/helpers')
  helpers.parsePagination.mockReturnValue({ limit: 20, offset: 0 })

  // Items query: from → innerJoin → leftJoin → where → groupBy → orderBy → limit → offset
  // Count query: from → innerJoin → where → resolves
  mockFrom
    .mockReturnValueOnce({ innerJoin: mockInnerJoin })   // items
    .mockReturnValueOnce({ innerJoin: mockInnerJoin })   // count
  mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  mockLeftJoin.mockReturnValue({ where: mockWhere, groupBy: mockGroupBy })
  mockWhere
    .mockReturnValueOnce({ groupBy: mockGroupBy })         // items
    .mockResolvedValueOnce([{ total: 1 }])                // count
  mockGroupBy.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockLimit.mockReturnValue({ offset: mockOffset })
  mockOffset.mockResolvedValue([MOCK_INSTANCE])

  // POST insert chain
  mockValues.mockReturnValue({ returning: mockReturning })
  mockReturning.mockResolvedValue([{ id: 'inst-new', workshopId: 'w-1' }])
})

describe('GET /api/admin/workshops/instances — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/workshops/instances — authenticated', () => {
  it('returns 200 with instances', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.instances).toHaveLength(1)
    expect(body.data.instances[0].current_participants).toBe(3)
  })
})

describe('POST /api/admin/workshops/instances — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest('POST', { workshopId: 'w-1', startDate: '2026-06-01T10:00:00Z' }))
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/workshops/instances — validation', () => {
  it('returns 400 when required fields missing', async () => {
    const response = await POST(makeRequest('POST', {}))
    expect(response.status).toBe(400)
  })

  it('returns 400 when workshop not found', async () => {
    // Override to return empty for workshop lookup
    mockFrom.mockReset()
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere })
    mockWhere.mockReset()
    mockWhere.mockResolvedValueOnce([])  // workshop not found
    const response = await POST(makeRequest('POST', { workshopId: 'w-bad', startDate: '2026-06-01T10:00:00Z' }))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/admin/workshops/instances — success', () => {
  it('returns 200 on success', async () => {
    mockFrom.mockReset()
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere })
    mockWhere.mockReset()
    mockWhere.mockResolvedValueOnce([{ id: 'w-1', maxParticipants: 10 }])
    const response = await POST(makeRequest('POST', { workshopId: 'w-1', startDate: '2026-06-01T10:00:00Z' }))
    expect(response.status).toBe(200)
    expect(mockReturning).toHaveBeenCalledTimes(1)
  })
})
