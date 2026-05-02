/**
 * @jest-environment node
 *
 * Tests for GET /api/technicians (public)
 *
 * Behaviors locked:
 *   GET - 200 with technician list, 200 empty list, 500 on DB error
 */

const mockSelect = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  repairerProfiles: {
    id: 'rp_id',
    userId: 'rp_userId',
    description: 'rp_description',
    hourlyRateCents: 'rp_hourlyRateCents',
    averageRating: 'rp_averageRating',
    totalJobsCompleted: 'rp_totalJobsCompleted',
    profileTier: 'rp_profileTier',
    city: 'rp_city',
    postalCode: 'rp_postalCode',
    canton: 'rp_canton',
    acceptsGratis: 'rp_acceptsGratis',
    acceptsKulturlegi: 'rp_acceptsKulturlegi',
    isVerified: 'rp_isVerified',
    serviceDeliveryTypes: 'rp_serviceDeliveryTypes',
    isActive: 'rp_isActive',
    status: 'rp_status',
  },
  userSkills: {
    userId: 'us_userId',
    skillId: 'us_skillId',
  },
  users: {
    id: 'u_id',
    name: 'u_name',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  or: (...args: unknown[]) => ({ __or: args }),
  desc: (a: unknown) => ({ __desc: a }),
  asc: (a: unknown) => ({ __asc: a }),
  isNull: (a: unknown) => ({ __isNull: a }),
  isNotNull: (a: unknown) => ({ __isNotNull: a }),
  count: () => ({ __count: true }),
}))

jest.mock('@/config/repairer-status', () => ({
  REPAIRER_PROFILE_TIER: { COMMUNITY: 'community', PROFESSIONAL: 'professional' },
  REPAIRER_STATUS: { ACTIVE: 'active' },
}))

jest.mock('@/config/it-hilfe', () => ({
  getSkillIds: () => ['hardware', 'software', 'network'],
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccessCached: (data: unknown, _maxAge?: number, _stale?: number) =>
      NextResponse.json({ success: true, data }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    parsePagination: (_req: unknown, _opts?: unknown) => ({ limit: 20, offset: 0 }),
  }
})

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

const MOCK_TECHNICIAN = {
  id: 'tech-1',
  userId: 'user-1',
  name: 'Anna Muster',
  bio: 'Erfahrene Technikerin',
  hourlyRateCents: 8000,
  averageRating: 4.8,
  totalJobsCompleted: 42,
  profileTier: 'professional',
  city: 'Bern',
  postalCode: '3000',
  canton: 'BE',
  acceptsGratis: false,
  acceptsKulturlegi: true,
  isVerified: true,
  serviceDeliveryTypes: ['onsite'],
  skills: ['hardware', 'network'],
}

// Chain builder shared across tests
function buildSelectChain(mainRows: unknown[], countRow: unknown) {
  const mockOffset = jest.fn().mockResolvedValue(mainRows)
  const mockLimit = jest.fn().mockReturnValue({ offset: mockOffset })
  const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit, offset: mockOffset })
  const mockGroupBy = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
  const mockWhere = jest.fn().mockReturnValue({ groupBy: mockGroupBy, orderBy: mockOrderBy })
  const mockLeftJoin = jest.fn().mockReturnValue({ where: mockWhere, innerJoin: jest.fn() })
  const mockInnerJoin = jest.fn().mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin, leftJoin: mockLeftJoin, where: mockWhere })

  // Count query chain: .from().innerJoin().leftJoin().where() resolves to array
  const mockCountWhere = jest.fn().mockResolvedValue([countRow])
  const mockCountLeftJoin = jest.fn().mockReturnValue({ where: mockCountWhere })
  const mockCountInnerJoin = jest.fn().mockReturnValue({ leftJoin: mockCountLeftJoin, where: mockCountWhere })
  const mockCountFrom = jest.fn().mockReturnValue({ innerJoin: mockCountInnerJoin, leftJoin: mockCountLeftJoin, where: mockCountWhere })

  let callCount = 0
  mockSelect.mockImplementation(() => {
    callCount++
    if (callCount === 1) return { from: mockFrom }
    return { from: mockCountFrom }
  })
}

beforeEach(() => {
  jest.resetAllMocks()
})

// ============================================================================
// GET — public list
// ============================================================================

describe('GET /api/technicians — public list', () => {
  it('returns 200 with technician list', async () => {
    buildSelectChain([MOCK_TECHNICIAN], { total: '1' })
    const req = new NextRequest('http://localhost/api/technicians')
    const response = await GET(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.technicians).toHaveLength(1)
    expect(body.data.technicians[0].name).toBe('Anna Muster')
  })

  it('returns 200 with empty list when no technicians found', async () => {
    buildSelectChain([], { total: '0' })
    const req = new NextRequest('http://localhost/api/technicians')
    const response = await GET(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.technicians).toEqual([])
    expect(body.data.pagination.total).toBe(0)
  })

  it('returns 200 with pagination metadata', async () => {
    buildSelectChain([MOCK_TECHNICIAN], { total: '5' })
    const req = new NextRequest('http://localhost/api/technicians?limit=20&offset=0')
    const response = await GET(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.pagination).toBeDefined()
    expect(body.data.pagination.total).toBe(5)
    expect(typeof body.data.pagination.hasMore).toBe('boolean')
  })

  it('handles tier=community filter', async () => {
    buildSelectChain([{ ...MOCK_TECHNICIAN, profileTier: 'community' }], { total: '1' })
    const req = new NextRequest('http://localhost/api/technicians?tier=community')
    const response = await GET(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.technicians[0].profileTier).toBe('community')
  })

  it('handles tier=professional filter', async () => {
    buildSelectChain([MOCK_TECHNICIAN], { total: '1' })
    const req = new NextRequest('http://localhost/api/technicians?tier=professional')
    const response = await GET(req)
    expect(response.status).toBe(200)
  })

  it('silently ignores unknown skill IDs', async () => {
    buildSelectChain([], { total: '0' })
    const req = new NextRequest('http://localhost/api/technicians?skills=invalid-skill')
    const response = await GET(req)
    // Unknown skills filtered out — query still runs, returns 200
    expect(response.status).toBe(200)
  })

  it('returns 500 when DB throws', async () => {
    mockSelect.mockImplementation(() => { throw new Error('DB error') })
    const req = new NextRequest('http://localhost/api/technicians')
    const response = await GET(req)
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })

  it('normalizes null skills to empty array', async () => {
    buildSelectChain([{ ...MOCK_TECHNICIAN, skills: null }], { total: '1' })
    const req = new NextRequest('http://localhost/api/technicians')
    const response = await GET(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.technicians[0].skills).toEqual([])
  })
})
