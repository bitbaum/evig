/**
 * @jest-environment node
 *
 * Tests for GET /api/it-hilfe/helpers/[id]
 *
 * Mission-relevant: helper profile is a public, cached route — UUID validation
 * and not-found handling prevent noise from bots hitting arbitrary IDs.
 *
 * Behaviors locked:
 *   GET /api/it-hilfe/helpers/[id]
 *   - returns 400 for invalid UUID
 *   - returns 404 when helper not found
 *   - returns 200 with helper profile
 *   - includes skills array (empty when no skills)
 *   - returns 500 when DB throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockGroupBy = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
  },
}))

jest.mock('@/db/schema', () => ({
  helperProfiles: { userId: 'hp_userId', bio: 'hp_bio', isActive: 'hp_isActive', hourlyRateCents: 'hp_hourlyRateCents', acceptsGratis: 'hp_acceptsGratis', acceptsKulturlegi: 'hp_acceptsKulturlegi', serviceTypes: 'hp_serviceTypes', locationCity: 'hp_locationCity', locationCanton: 'hp_locationCanton', maxTravelKm: 'hp_maxTravelKm', isVerified: 'hp_isVerified', averageRating: 'hp_averageRating', totalHelpsCompleted: 'hp_totalHelpsCompleted', createdAt: 'hp_createdAt' },
  userSkills: { skillId: 'us_skillId', userId: 'us_userId' },
  users: { id: 'u_id', name: 'u_name' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'sql' }), { raw: jest.fn(), join: jest.fn() }),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccessCached: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (entity: string) =>
      NextResponse.json({ success: false, error: `${entity} nicht gefunden` }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const INVALID_ID = 'not-a-uuid'

const MOCK_HELPER = {
  userId: VALID_UUID,
  name: 'Hans Müller',
  bio: 'Ich helfe gerne',
  hourlyRateCents: null,
  acceptsGratis: true,
  acceptsKulturlegi: true,
  serviceTypes: ['remote'],
  locationCity: 'Zürich',
  locationCanton: 'ZH',
  maxTravelKm: 20,
  isVerified: false,
  averageRating: null,
  totalHelpsCompleted: 0,
  createdAt: '2026-01-01',
  skills: ['wifi', 'linux'],
}

function makeRequest(id = VALID_UUID) {
  return new NextRequest(`http://localhost/api/it-hilfe/helpers/${id}`)
}

function makeContext(id = VALID_UUID) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin })
  mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin })
  mockLeftJoin.mockReturnValue({ where: mockWhere })
  mockWhere.mockReturnValue({ groupBy: mockGroupBy })
  mockGroupBy.mockResolvedValue([MOCK_HELPER])
})

// ============================================================================
// GET /api/it-hilfe/helpers/[id]
// ============================================================================

describe('GET /api/it-hilfe/helpers/[id] — validation', () => {
  it('returns 400 for invalid UUID', async () => {
    const response = await GET(makeRequest(INVALID_ID), makeContext(INVALID_ID))
    expect(response.status).toBe(400)
  })

  it('returns 400 for empty-ish id', async () => {
    const response = await GET(makeRequest('abc'), makeContext('abc'))
    expect(response.status).toBe(400)
  })
})

describe('GET /api/it-hilfe/helpers/[id] — not found', () => {
  it('returns 404 when helper not found', async () => {
    mockGroupBy.mockResolvedValueOnce([])
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })
})

describe('GET /api/it-hilfe/helpers/[id] — success', () => {
  it('returns 200 with helper profile', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
  })

  it('returns helper data in response', async () => {
    const response = await GET(makeRequest(), makeContext())
    const body = await response.json()
    expect(body.data.helper.name).toBe('Hans Müller')
    expect(body.data.helper.locationCity).toBe('Zürich')
  })

  it('includes skills array', async () => {
    const response = await GET(makeRequest(), makeContext())
    const body = await response.json()
    expect(body.data.helper.skills).toEqual(['wifi', 'linux'])
  })

  it('returns empty skills array when no skills', async () => {
    mockGroupBy.mockResolvedValueOnce([{ ...MOCK_HELPER, skills: null }])
    const response = await GET(makeRequest(), makeContext())
    const body = await response.json()
    expect(body.data.helper.skills).toEqual([])
  })
})

describe('GET /api/it-hilfe/helpers/[id] — errors', () => {
  it('returns 500 when DB throws', async () => {
    mockGroupBy.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(500)
  })
})
