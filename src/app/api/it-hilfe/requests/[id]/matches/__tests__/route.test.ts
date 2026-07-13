/**
 * @jest-environment node
 *
 * Tests for GET /api/it-hilfe/requests/[id]/matches (public, no auth)
 */

// ── DB mocks ───────────────────────────────────────────────────────────────

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockGroupBy = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  itHilfeRequests: { id: 'ihr_id', requesterId: 'ihr_requesterId', categoryId: 'ihr_categoryId', skillsNeeded: 'ihr_skillsNeeded', canton: 'ihr_canton', budgetAmountCents: 'ihr_budgetAmountCents', budgetType: 'ihr_budgetType', budgetTier: 'ihr_budgetTier', serviceType: 'ihr_serviceType', preferredTechnicianId: 'ihr_preferredTechnicianId' },
  repairerProfiles: { id: 'rp_id', userId: 'rp_userId', isActive: 'rp_isActive', isVerified: 'rp_isVerified', profileTier: 'rp_profileTier', description: 'rp_description', hourlyRateCents: 'rp_hourlyRateCents', acceptsGratis: 'rp_acceptsGratis', acceptsKulturlegi: 'rp_acceptsKulturlegi', serviceDeliveryTypes: 'rp_serviceDeliveryTypes', canton: 'rp_canton', city: 'rp_city', averageRating: 'rp_averageRating', totalJobsCompleted: 'rp_totalJobsCompleted' },
  userSkills: { userId: 'us_userId', skillId: 'us_skillId' },
  userProfiles: { userId: 'up_userId', isVerified: 'up_isVerified' },
  users: { id: 'u_id', name: 'u_name' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  ne: (a: unknown, b: unknown) => ({ __ne: [a, b] }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccessCached: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Server error' },
}))

jest.mock('@/config/it-hilfe', () => ({
  getCategoryById: jest.fn().mockReturnValue(null),
  MATCH_SCORES: { PER_SKILL: 10, DEVICE_CATEGORY_BONUS: 5, SAME_CANTON: 8, BUDGET_COMPATIBLE: 10, SERVICE_TYPE_MATCH: 5 },
  BUDGET_TIER: { GRATIS: 'gratis', KULTURLEGI: 'kulturlegi', PAID: 'paid', FREE: 'free' },
}))

jest.mock('@/config/repairer-status', () => ({
  REPAIRER_PROFILE_TIER: { COMMUNITY: 'community', PROFESSIONAL: 'professional' },
}))

jest.mock('@/lib/it-hilfe/sql', () => ({
  technicianHasSkillMatch: jest.fn().mockReturnValue({ __skillMatch: true }),
}))

// The route composes its WHERE from publicTechnicianListCondition(), whose
// internals call drizzle's or()/REPAIRER_STATUS (not part of these unit mocks).
// Mock it like technicianHasSkillMatch — it returns an opaque SQL fragment the
// route only feeds into and().
jest.mock('@/lib/domain/technician-visibility', () => ({
  publicTechnicianListCondition: jest.fn().mockReturnValue({ __publicVisibility: true }),
}))

// ── Fixtures ───────────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const MOCK_REQUEST_DATA = {
  id: VALID_UUID,
  requesterId: 'requester-1',
  categoryId: 'cat-1',
  skillsNeeded: ['skill-1'],
  canton: 'ZH',
  budgetAmountCents: null,
  budgetType: 'free',
  budgetTier: null,
  serviceType: 'remote',
  preferredTechnicianId: null,
}

const MOCK_HELPER = {
  id: 'helper-profile-1',
  userId: 'helper-1',
  userName: 'Helper Alice',
  bio: 'Experienced technician',
  hourlyRateCents: null,
  acceptsGratis: true,
  acceptsKulturlegi: false,
  serviceTypes: ['remote'],
  locationCanton: 'ZH',
  locationCity: 'Zürich',
  averageRating: '4.5',
  totalHelpsCompleted: 10,
  skills: ['skill-1'],
  skillCount: 1,
}

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ── Helpers ────────────────────────────────────────────────────────────────

const routeParams = (id: string) => ({ params: Promise.resolve({ id }) })

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/it-hilfe/requests/${id}/matches`)
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/it-hilfe/requests/[id]/matches', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 404 for invalid UUID format', async () => {
    const res = await GET(makeRequest('bad-id'), routeParams('bad-id'))
    expect(res.status).toBe(404)
  })

  it('returns 404 when request not found', async () => {
    // First select: request not found
    mockGroupBy.mockResolvedValue([])
    mockWhere.mockReturnValue({ groupBy: mockGroupBy })
    mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
    mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin })
    mockFrom.mockReturnValue({ where: mockWhere, innerJoin: mockInnerJoin })
    mockSelect.mockReturnValue({ from: mockFrom })

    // First select: request not found
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    })

    const res = await GET(makeRequest(VALID_UUID), routeParams(VALID_UUID))
    expect(res.status).toBe(404)
  })

  it('returns 200 with matches array', async () => {
    // First select: request data
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([MOCK_REQUEST_DATA]),
      }),
    })

    // Second select: helpers
    mockGroupBy.mockResolvedValue([MOCK_HELPER])
    mockWhere.mockReturnValue({ groupBy: mockGroupBy })
    mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
    mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin })
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin })
    mockSelect.mockReturnValue({ from: mockFrom })

    const res = await GET(makeRequest(VALID_UUID), routeParams(VALID_UUID))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data.matches)).toBe(true)
    expect(body.data.total).toBeGreaterThanOrEqual(0)
  })

  it('returns 200 with empty matches when no helpers match', async () => {
    // Request with no skills needed
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ ...MOCK_REQUEST_DATA, skillsNeeded: [] }]),
      }),
    })

    // No helpers found
    mockGroupBy.mockResolvedValue([])
    mockWhere.mockReturnValue({ groupBy: mockGroupBy })
    mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
    mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin })
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin })
    mockSelect.mockReturnValue({ from: mockFrom })

    const res = await GET(makeRequest(VALID_UUID), routeParams(VALID_UUID))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.matches).toEqual([])
    expect(body.data.total).toBe(0)
  })
})
