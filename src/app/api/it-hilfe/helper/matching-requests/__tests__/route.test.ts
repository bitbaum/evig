/**
 * @jest-environment node
 *
 * Tests for GET /api/it-hilfe/helper/matching-requests (withAuth)
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

const mockExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockExecute(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  itHilfeRequests: { id: 'ihr_id', requesterId: 'ihr_requesterId', status: 'ihr_status' },
  itHilfeOffers: { id: 'iho_id', helperId: 'iho_helperId' },
  userSkills: { userId: 'us_userId', skillId: 'us_skillId' },
  users: { id: 'u_id', name: 'u_name' },
}))

jest.mock('@/db/schema/auth', () => ({
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    parsePagination: () => ({ limit: 20, offset: 0 }),
  
    hasMoreItems: (offset: number, limit: number, total: number) => offset + limit < total,}
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Server error' },
}))

jest.mock('@/config/it-hilfe', () => ({
  getCategoryIds: jest.fn().mockReturnValue(['cat-1']),
  URGENCY_LEVELS: [{ id: 'low' }, { id: 'high' }],
  REQUEST_STATUS: { OPEN: 'open', MATCHED: 'matched', COMPLETED: 'completed' },
  OFFER_STATUS: { PENDING: 'pending', ACCEPTED: 'accepted', REJECTED: 'rejected', WITHDRAWN: 'withdrawn' },
}))

jest.mock('drizzle-orm', () => ({
  sql: Object.assign(
    (strings: TemplateStringsArray, ..._vals: unknown[]) => ({ __sql: strings.join('?') }),
    {
      raw: (s: string) => ({ __raw: s }),
      join: (items: unknown[]) => items,
    }
  ),
  getTableName: (_t: unknown) => 'table_name',
}))

// ── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_SKILL_ROWS = { rows: [{ skill_id: 'skill-1' }] }

const MOCK_REQUEST_ROWS = {
  rows: [
    {
      _total_count: '1',
      id: 'req-1',
      title: 'Fix laptop',
      description: 'Needs help',
      category_id: 'cat-1',
      device_brand: 'Dell',
      device_model: 'XPS',
      urgency: 'low',
      budget_type: 'free',
      budget_amount_cents: null,
      budget_tier: null,
      city: 'Zürich',
      canton: 'ZH',
      service_type: 'remote',
      skills_needed: ['skill-1'],
      offer_count: 0,
      created_at: new Date('2024-01-01'),
      requester_name: 'Jane',
    },
  ],
}

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(url = 'http://localhost/api/it-hilfe/helper/matching-requests') {
  return new NextRequest(url)
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/it-hilfe/helper/matching-requests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns empty list when helper has no skills', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    mockExecute.mockResolvedValue({ rows: [] })

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.requests).toEqual([])
    expect(body.data.total).toBe(0)
  })

  it('returns matching requests when helper has skills', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    mockExecute
      .mockResolvedValueOnce(MOCK_SKILL_ROWS)
      .mockResolvedValueOnce(MOCK_REQUEST_ROWS)

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.requests).toHaveLength(1)
    expect(body.data.requests[0].id).toBe('req-1')
    expect(body.data.total).toBe(1)
  })

  it('LEFT JOIN on offers filters out WITHDRAWN offers so the helper can rediscover requests after withdrawing', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    mockExecute
      .mockResolvedValueOnce(MOCK_SKILL_ROWS)
      .mockResolvedValueOnce(MOCK_REQUEST_ROWS)

    await GET(makeRequest())

    // 2nd db.execute call is the matching-requests query. The sql-mock
    // collapses interpolations to '?' so we can't read the bound value,
    // but the literal `o.status !=` fragment must be present in the
    // LEFT JOIN — without it, the helper's withdrawn-then-want-to-reoffer
    // path is locked out because o.id IS NULL would never match (the
    // withdrawn row still exists, just with status=WITHDRAWN). Matches
    // the POST /offers route (commit ab6bc94e) which already allows
    // re-offering after WITHDRAWN.
    const secondCall = mockExecute.mock.calls[1][0] as { __sql: string }
    expect(secondCall.__sql).toMatch(/o\.status\s*!=/)
  })
})
