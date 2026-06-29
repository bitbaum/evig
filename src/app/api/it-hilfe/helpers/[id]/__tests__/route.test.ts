/**
 * @jest-environment node
 *
 * Tests for GET /api/it-hilfe/helpers/[id] (legacy proxy to technician-service)
 */

jest.mock('@/lib/services/technician-service', () => ({
  getTechnicianByIdOrUserId: jest.fn(),
  TECHNICIAN_UUID_RE: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccessCached: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (_err: unknown, msg: string, status = 500) =>
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

import { NextRequest } from 'next/server'
import { GET } from '../route'
import { getTechnicianByIdOrUserId } from '@/lib/services/technician-service'
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'

const mockGet = getTechnicianByIdOrUserId as jest.MockedFunction<typeof getTechnicianByIdOrUserId>

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const MOCK_TECHNICIAN = {
  id: VALID_UUID,
  userId: 'user-1',
  name: 'Hans Müller',
  avatarUrl: null,
  bio: 'Ich helfe gerne',
  hourlyRateCents: null,
  averageRating: null,
  totalJobsCompleted: 0,
  totalReviews: 0,
  profileTier: REPAIRER_PROFILE_TIER.COMMUNITY,
  city: 'Zürich',
  postalCode: '8000',
  canton: 'Zürich',
  acceptsGratis: true,
  acceptsKulturlegi: true,
  isVerified: false,
  serviceDeliveryTypes: ['remote'],
  maxTravelKm: 20,
  responseTimeHours: 24,
  createdAt: '2026-01-01',
  skills: ['wifi_setup', 'linux_install'],
  services: [],
}

function makeContext(id = VALID_UUID) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockGet.mockResolvedValue(MOCK_TECHNICIAN)
})

describe('GET /api/it-hilfe/helpers/[id]', () => {
  it('returns 400 for invalid UUID', async () => {
    const response = await GET(
      new NextRequest(`http://localhost/api/it-hilfe/helpers/not-a-uuid`),
      makeContext('not-a-uuid'),
    )
    expect(response.status).toBe(400)
  })

  it('returns 404 when technician not found', async () => {
    mockGet.mockResolvedValueOnce(null)
    const response = await GET(
      new NextRequest(`http://localhost/api/it-hilfe/helpers/${VALID_UUID}`),
      makeContext(),
    )
    expect(response.status).toBe(404)
  })

  it('returns 404 for professional tier (legacy route is community-only)', async () => {
    mockGet.mockResolvedValueOnce({ ...MOCK_TECHNICIAN, profileTier: REPAIRER_PROFILE_TIER.PROFESSIONAL })
    const response = await GET(
      new NextRequest(`http://localhost/api/it-hilfe/helpers/${VALID_UUID}`),
      makeContext(),
    )
    expect(response.status).toBe(404)
  })

  it('returns legacy helper shape for community profile', async () => {
    const response = await GET(
      new NextRequest(`http://localhost/api/it-hilfe/helpers/${VALID_UUID}`),
      makeContext(),
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.data.helper.name).toBe('Hans Müller')
    expect(body.data.helper.locationCity).toBe('Zürich')
    expect(body.data.helper.skills).toEqual(['wifi_setup', 'linux_install'])
  })

  it('returns 500 when service throws', async () => {
    mockGet.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(
      new NextRequest(`http://localhost/api/it-hilfe/helpers/${VALID_UUID}`),
      makeContext(),
    )
    expect(response.status).toBe(500)
  })
})
