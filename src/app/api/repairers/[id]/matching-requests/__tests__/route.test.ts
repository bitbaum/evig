/**
 * @jest-environment node
 *
 * Tests for GET /api/repairers/[id]/matching-requests (public)
 *
 * Behaviors locked:
 *   GET - 404 (repairer not found), 200 with matching requests
 */

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockInnerJoin = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  repairerProfiles: {
    id: 'rp_id',
    servicesOffered: 'rp_servicesOffered',
    city: 'rp_city',
    postalCode: 'rp_postalCode',
    serviceRadiusKm: 'rp_serviceRadiusKm',
    remoteServices: 'rp_remoteServices',
    isActive: 'rp_isActive',
  },
  itHilfeRequests: {
    id: 'ihr_id',
    title: 'ihr_title',
    categoryId: 'ihr_categoryId',
    deviceBrand: 'ihr_deviceBrand',
    deviceModel: 'ihr_deviceModel',
    urgency: 'ihr_urgency',
    budgetType: 'ihr_budgetType',
    city: 'ihr_city',
    canton: 'ihr_canton',
    postalCode: 'ihr_postalCode',
    serviceType: 'ihr_serviceType',
    skillsNeeded: 'ihr_skillsNeeded',
    status: 'ihr_status',
    offerCount: 'ihr_offerCount',
    createdAt: 'ihr_createdAt',
    requesterId: 'ihr_requesterId',
    expiresAt: 'ihr_expiresAt',
  },
  users: { id: 'u_id', name: 'u_name' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  sql: Object.assign(
    (_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }),
    {
      raw: (s: string) => ({ __raw: s }),
      join: (items: unknown[]) => items,
    }
  ),
  desc: (a: unknown) => ({ __desc: a }),
  inArray: (a: unknown, b: unknown) => ({ __inArray: [a, b] }),
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

jest.mock('@/config/it-hilfe', () => ({
  REQUEST_STATUS: { OPEN: 'open', IN_DISCUSSION: 'in_discussion' },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

const MOCK_REPAIRER = {
  id: 'repairer-1',
  servicesOffered: ['computer_repair', 'network'],
  city: 'Zürich',
  postalCode: '8001',
  serviceRadiusKm: 50,
  remoteServices: true,
}

const MOCK_REQUEST = {
  id: 'req-1',
  title: 'Fix my laptop',
  categoryId: 'cat-1',
  deviceBrand: 'Apple',
  deviceModel: 'MacBook',
  urgency: 'normal',
  budgetType: 'free',
  city: 'Zürich',
  canton: 'ZH',
  postalCode: '8001',
  serviceType: 'remote',
  skillsNeeded: ['computer_repair'],
  status: 'open',
  offerCount: 0,
  createdAt: new Date(),
  requesterName: 'Jane',
}

function makeContext(id = 'repairer-1') {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(id = 'repairer-1') {
  return new NextRequest(`http://localhost/api/repairers/${id}/matching-requests`)
}

beforeEach(() => {
  jest.resetAllMocks()
  mockLimit.mockResolvedValue([MOCK_REQUEST])
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy, limit: mockLimit })
  mockInnerJoin.mockReturnValue({ where: mockWhere })
  mockFrom.mockReturnValue({ where: mockWhere, innerJoin: mockInnerJoin })
  mockSelect.mockReturnValue({ from: mockFrom })
})

describe('GET /api/repairers/[id]/matching-requests', () => {
  it('returns 404 when repairer not found', async () => {
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Reparateur nicht gefunden')
  })

  it('returns 200 with matching requests', async () => {
    // First select: repairer found
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([MOCK_REPAIRER]),
      }),
    })
    // Second select: matching requests
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([MOCK_REQUEST]),
            }),
          }),
        }),
      }),
    })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.requests).toHaveLength(1)
    expect(body.data.requests[0].id).toBe('req-1')
    expect(body.data.repairerServices).toEqual(['computer_repair', 'network'])
  })

  it('returns 200 with empty list when no requests match', async () => {
    // First select: repairer found
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([MOCK_REPAIRER]),
      }),
    })
    // Second select: no matching requests
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    })

    const res = await GET(makeRequest(), makeContext())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.requests).toHaveLength(0)
  })
})
