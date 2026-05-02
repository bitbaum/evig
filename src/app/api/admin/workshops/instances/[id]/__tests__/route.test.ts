/**
 * @jest-environment node
 *
 * Tests for GET/PUT/DELETE /api/admin/workshops/instances/[id]
 *
 * Behaviors locked:
 *   GET - 401, 404, 200
 *   PUT - 401, 400 (no fields), 404, 200
 *   DELETE - 401, 400 (has registrations), 200
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
const mockInnerJoin = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockGroupBy = jest.fn()
const mockOrderBy = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockUpdateReturning = jest.fn()
const mockDelete = jest.fn()
const mockDeleteWhere = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
    delete: (...args: unknown[]) => { mockDelete(...args); return { where: mockDeleteWhere } },
  },
}))

jest.mock('@/db/schema', () => ({
  workshopInstances: { id: 'wi_id', workshopId: 'wi_workshopId', startDate: 'wi_startDate', endDate: 'wi_endDate', location: 'wi_location', instructor: 'wi_instructor', maxParticipants: 'wi_maxP', notes: 'wi_notes', status: 'wi_status', createdAt: 'wi_createdAt' },
  workshops: { id: 'w_id', title: 'w_title', slug: 'w_slug' },
  workshopRegistrations: { id: 'wr_id', workshopInstanceId: 'wr_instanceId', userId: 'wr_userId', status: 'wr_status', paymentStatus: 'wr_paymentStatus', paymentAmountCents: 'wr_paymentAmountCents', createdAt: 'wr_createdAt', attended: 'wr_attended', rating: 'wr_rating', feedback: 'wr_feedback' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  desc: (col: unknown) => ({ __desc: col }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
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
import { GET, PUT, DELETE } from '../route'

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_INSTANCE = { id: 'inst-1', workshop_id: 'w-1', workshop_title: 'Laptop Repair', workshop_slug: 'laptop-repair', current_participants: 3 }

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/workshops/instances/inst-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(id = 'inst-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // GET: 2 queries - instance details (groupBy terminal) + registrations (orderBy terminal)
  // PUT: existence check (where terminal) + update
  // DELETE: registration count (where terminal) + delete
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere })
  mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin, innerJoin: mockInnerJoin, where: mockWhere })
  mockLeftJoin.mockReturnValue({ where: mockWhere, groupBy: mockGroupBy })
  mockWhere
    .mockReturnValueOnce({ groupBy: mockGroupBy })       // instance query: where → groupBy
    .mockReturnValueOnce({ orderBy: mockOrderBy })       // registrations query: where → orderBy
  mockGroupBy.mockResolvedValue([MOCK_INSTANCE])
  mockOrderBy.mockResolvedValue([])

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning })
  mockUpdateReturning.mockResolvedValue([{ id: 'inst-1' }])
  mockDeleteWhere.mockResolvedValue(undefined)
})

describe('GET /api/admin/workshops/instances/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/workshops/instances/[id] — authenticated', () => {
  it('returns 404 when not found', async () => {
    mockGroupBy.mockResolvedValueOnce([])
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 with instance and registrations', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.instance.id).toBe('inst-1')
  })
})

describe('PUT /api/admin/workshops/instances/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PUT(makeRequest('PUT', { location: 'New location' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PUT /api/admin/workshops/instances/[id] — validation', () => {
  it('returns 400 when no fields to update', async () => {
    mockWhere.mockReset()
    mockWhere.mockResolvedValueOnce([{ id: 'inst-1' }])
    const response = await PUT(makeRequest('PUT', {}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when instance not found', async () => {
    mockWhere.mockReset()
    mockWhere.mockResolvedValueOnce([])
    const response = await PUT(makeRequest('PUT', { location: 'New' }), makeContext())
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/admin/workshops/instances/[id] — success', () => {
  it('returns 200 on success', async () => {
    mockWhere.mockReset()
    mockWhere.mockResolvedValueOnce([{ id: 'inst-1' }])
    const response = await PUT(makeRequest('PUT', { location: 'New location' }), makeContext())
    expect(response.status).toBe(200)
  })
})

describe('DELETE /api/admin/workshops/instances/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/admin/workshops/instances/[id] — authenticated', () => {
  it('returns 400 when instance has registrations', async () => {
    mockWhere.mockReset()
    mockWhere.mockResolvedValueOnce([{ count: '2' }])
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 200 when no registrations', async () => {
    mockWhere.mockReset()
    mockWhere.mockResolvedValueOnce([{ count: '0' }])
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(200)
  })
})
