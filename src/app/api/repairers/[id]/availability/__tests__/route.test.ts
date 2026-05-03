/**
 * @jest-environment node
 *
 * Tests for GET /api/repairers/[id]/availability (public)
 *
 * Behaviors locked:
 *   GET - 404 (repairer not found), 404 (inactive), 200 with slots
 */

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  repairerProfiles: {
    id: 'rp_id',
    status: 'rp_status',
    isActive: 'rp_isActive',
    availabilitySchedule: 'rp_availabilitySchedule',
  },
  repairerAvailability: {
    id: 'ra_id',
    repairerId: 'ra_repairerId',
    date: 'ra_date',
    startTime: 'ra_startTime',
    endTime: 'ra_endTime',
    durationHours: 'ra_durationHours',
    availabilityType: 'ra_availabilityType',
    notes: 'ra_notes',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  sql: Object.assign(
    (_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  desc: (a: unknown) => ({ __desc: a }),
  asc: (a: unknown) => ({ __asc: a }),
  gte: (a: unknown, b: unknown) => ({ __gte: [a, b] }),
  lte: (a: unknown, b: unknown) => ({ __lte: [a, b] }),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccessCached: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Server error',
    REPAIRER_NOT_FOUND: 'Reparateur nicht gefunden', },
}))

jest.mock('@/config/repairer-status', () => ({
  REPAIRER_STATUS: { ACTIVE: 'active', INACTIVE: 'inactive' },
  REPAIRER_AVAILABILITY_TYPE: { AVAILABLE: 'available', BOOKED: 'booked', BLOCKED: 'blocked' },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

const MOCK_REPAIRER = {
  id: 'repairer-1',
  status: 'active',
  isActive: true,
  availabilitySchedule: null,
}

const MOCK_SLOT = {
  id: 'slot-1',
  date: '2025-05-10',
  start_time: '09:00:00',
  end_time: '10:00:00',
  duration_hours: '1',
  availability_type: 'available',
  notes: null,
}

function makeContext(id = 'repairer-1') {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(id = 'repairer-1') {
  return new NextRequest(`http://localhost/api/repairers/${id}/availability?start_date=2025-05-10&end_date=2025-05-15`)
}

beforeEach(() => {
  jest.resetAllMocks()
  // Default: repairer found + active, explicit slots returned, no booked slots
  mockOrderBy.mockResolvedValue([MOCK_SLOT])
  mockWhere.mockReturnValue([MOCK_REPAIRER]) // first select (repairer check)
  mockFrom.mockReturnValue({ where: mockWhere })
  mockSelect.mockReturnValue({ from: mockFrom })
})

describe('GET /api/repairers/[id]/availability', () => {
  it('returns 404 when repairer not found', async () => {
    // First select returns empty (repairer not found)
    mockWhere.mockResolvedValueOnce([])
    mockFrom.mockReturnValueOnce({ where: mockWhere })
    mockSelect.mockReturnValueOnce({ from: mockFrom })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Reparateur nicht gefunden')
  })

  it('returns 404 when repairer is inactive', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_REPAIRER, isActive: false }])
    mockFrom.mockReturnValueOnce({ where: mockWhere })
    mockSelect.mockReturnValueOnce({ from: mockFrom })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(404)
  })

  it('returns 404 when repairer status is not active', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_REPAIRER, status: 'inactive' }])
    mockFrom.mockReturnValueOnce({ where: mockWhere })
    mockSelect.mockReturnValueOnce({ from: mockFrom })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(404)
  })

  it('returns 200 with slots grouped by date', async () => {
    // First select: repairer found
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([MOCK_REPAIRER]),
      }),
    })
    // Second select: explicit slots (with orderBy)
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue([MOCK_SLOT]),
        }),
      }),
    })
    // Third select: booked slots
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.repairer_id).toBe('repairer-1')
    expect(body.data.slots).toBeDefined()
    expect(body.data.total_available_slots).toBe(1)
  })

  it('returns 200 with empty slots when no explicit slots and no schedule', async () => {
    // First select: repairer found, no schedule
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ ...MOCK_REPAIRER, availabilitySchedule: null }]),
      }),
    })
    // Second select: no explicit slots
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue([]),
        }),
      }),
    })
    // Third select: no booked slots
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.total_available_slots).toBe(0)
    expect(body.data.slots).toEqual({})
  })
})
