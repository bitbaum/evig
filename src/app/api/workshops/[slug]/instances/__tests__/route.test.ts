/**
 * @jest-environment node
 *
 * Tests for GET /api/workshops/[slug]/instances (public)
 *
 * Behaviors locked:
 *   GET - 200 with instances list, 200 empty list, 404 (workshop not found)
 */

const mockSelect = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  workshops: {
    id: 'ws_id', slug: 'ws_slug', isActive: 'ws_isActive',
  },
  workshopInstances: {
    id: 'wi_id', workshopId: 'wi_workshopId',
    startDate: 'wi_startDate', endDate: 'wi_endDate',
    location: 'wi_location', maxParticipants: 'wi_maxParticipants',
    status: 'wi_status', notes: 'wi_notes',
    createdAt: 'wi_createdAt', updatedAt: 'wi_updatedAt',
  },
  workshopRegistrations: { id: 'wr_id', workshopInstanceId: 'wr_workshopInstanceId' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  asc: (a: unknown) => ({ __asc: a }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccessCached: (data: unknown, _maxAge?: number, _stale?: number) =>
      NextResponse.json({ success: true, data }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

import { NextRequest } from 'next/server'
import { GET } from '../route'

const MOCK_INSTANCE = {
  id: 'instance-1',
  workshop_id: 'workshop-1',
  start_date: new Date('2026-06-01T10:00:00Z'),
  end_date: new Date('2026-06-01T12:00:00Z'),
  location: 'Bern',
  max_participants: 15,
  current_participants: '3',
  status: 'scheduled',
  notes: null,
  created_at: new Date(),
  updated_at: new Date(),
}

// Build a full instance query chain: innerJoin → leftJoin → groupBy → orderBy
function makeInstancesChain(rows: unknown[]) {
  const orderBy = jest.fn().mockResolvedValue(rows)
  const groupBy = jest.fn().mockReturnValue({ orderBy })
  const leftJoin = jest.fn().mockReturnValue({ groupBy })
  const innerJoin = jest.fn().mockReturnValue({ leftJoin })
  const from = jest.fn().mockReturnValue({ innerJoin })
  return { from }
}

// Build a workshop existence check chain: where (resolves to array)
function makeWorkshopCheckChain(workshop: unknown) {
  const where = jest.fn().mockResolvedValue(workshop ? [workshop] : [])
  const from = jest.fn().mockReturnValue({ where })
  return { from }
}

beforeEach(() => {
  jest.resetAllMocks()
})

// ============================================================================
// GET — public
// ============================================================================

describe('GET /api/workshops/[slug]/instances — success', () => {
  it('returns 200 with instances list', async () => {
    mockSelect.mockReturnValue(makeInstancesChain([MOCK_INSTANCE]))

    const req = new NextRequest('http://localhost/api/workshops/linux-einfuehrung/instances')
    const response = await GET(req, { params: Promise.resolve({ slug: 'linux-einfuehrung' }) })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data[0].id).toBe('instance-1')
    expect(body.data[0].current_participants).toBe(3)
  })

  it('returns 200 with empty list when workshop has no instances', async () => {
    // First call: instances query returns empty → triggers workshop existence check
    mockSelect
      .mockReturnValueOnce(makeInstancesChain([]))
      .mockReturnValue(makeWorkshopCheckChain({ id: 'workshop-1' }))

    const req = new NextRequest('http://localhost/api/workshops/linux-einfuehrung/instances')
    const response = await GET(req, { params: Promise.resolve({ slug: 'linux-einfuehrung' }) })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data).toEqual([])
  })

  it('returns 404 when workshop does not exist', async () => {
    mockSelect
      .mockReturnValueOnce(makeInstancesChain([]))
      .mockReturnValue(makeWorkshopCheckChain(null))

    const req = new NextRequest('http://localhost/api/workshops/nonexistent/instances')
    const response = await GET(req, { params: Promise.resolve({ slug: 'nonexistent' }) })

    expect(response.status).toBe(404)
  })
})
