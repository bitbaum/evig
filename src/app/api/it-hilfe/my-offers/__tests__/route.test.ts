/**
 * @jest-environment node
 *
 * Tests for GET /api/it-hilfe/my-offers (withAuth)
 */

// ── Shared auth mock ───────────────────────────────────────────────────────

const mockAuth = jest.fn()

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: unknown) =>
    (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext)
      }),
  parsePagination: () => ({ limit: 20, offset: 0 }),
}))

// ── DB mocks ───────────────────────────────────────────────────────────────

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockOffset = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  itHilfeOffers: { id: 'iho_id', helperId: 'iho_helperId', requestId: 'iho_requestId', message: 'iho_message', estimatedTime: 'iho_estimatedTime', proposedCompensation: 'iho_proposedCompensation', relevantSkills: 'iho_relevantSkills', status: 'iho_status', createdAt: 'iho_createdAt' },
  itHilfeRequests: { id: 'ihr_id', requesterId: 'ihr_requesterId', title: 'ihr_title', categoryId: 'ihr_categoryId', deviceBrand: 'ihr_deviceBrand', deviceModel: 'ihr_deviceModel', status: 'ihr_status', city: 'ihr_city', canton: 'ihr_canton' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    parsePagination: () => ({ limit: 20, offset: 0 }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
    hasMoreItems: (offset: number, limit: number, total: number) => offset + limit < total,
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Server error' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  desc: (a: unknown) => ({ __desc: a }),
}))

// ── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_OFFER_ROW = {
  _total: 1,
  id: 'offer-1',
  requestId: 'req-1',
  message: 'I can help',
  estimatedTime: '2h',
  proposedCompensation: null,
  relevantSkills: ['skill-1'],
  status: 'pending',
  createdAt: new Date('2024-01-01'),
  request_title: 'Fix my laptop',
  request_category_id: 'cat-1',
  request_device_brand: 'Dell',
  request_device_model: 'XPS',
  request_status: 'open',
  request_city: 'Zürich',
  request_canton: 'ZH',
  requester_name: 'Jane',
}

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(url = 'http://localhost/api/it-hilfe/my-offers') {
  return new NextRequest(url)
}

function setupSelectChain(rows: unknown[]) {
  mockOffset.mockResolvedValue(rows)
  mockLimit.mockReturnValue({ offset: mockOffset })
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  // Two innerJoins: first returns { innerJoin }, second returns { where }
  mockInnerJoin
    .mockReturnValueOnce({ innerJoin: mockInnerJoin })
    .mockReturnValue({ where: mockWhere })
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin })
  mockSelect.mockReturnValue({ from: mockFrom })
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/it-hilfe/my-offers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 200 with offers when authenticated', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupSelectChain([MOCK_OFFER_ROW])

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.offers).toHaveLength(1)
    expect(body.data.total).toBe(1)
    expect(body.data.offers[0].id).toBe('offer-1')
    expect(body.data.offers[0].request.title).toBe('Fix my laptop')
  })

  it('returns 200 with empty offers list', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupSelectChain([])

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.offers).toEqual([])
    expect(body.data.total).toBe(0)
  })
})
