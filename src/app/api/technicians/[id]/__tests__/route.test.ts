/**
 * @jest-environment node
 *
 * Tests for GET /api/technicians/[id] (public)
 *
 * Behaviors locked:
 *   GET - 400 (invalid UUID), 404 (not found), 200 with profile
 */

const mockGetTechnicianById = jest.fn()

jest.mock('@/lib/services/technician-service', () => ({
  ...jest.requireActual('@/lib/services/technician-service'),
  getTechnicianById: (...args: unknown[]) => mockGetTechnicianById(...args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccessCached: (data: unknown, _maxAge?: number, _stale?: number) =>
      NextResponse.json({ success: true, data }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
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

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const MOCK_TECHNICIAN = {
  id: VALID_UUID,
  userId: 'user-1',
  name: 'Anna Muster',
  bio: 'Erfahrene Technikerin',
  hourlyRateCents: 8000,
  averageRating: 4.8,
  totalJobsCompleted: 42,
  totalReviews: 10,
  profileTier: 'professional',
  city: 'Bern',
  postalCode: '3000',
  acceptsGratis: false,
  acceptsKulturlegi: true,
  isVerified: true,
  serviceDeliveryTypes: ['onsite'],
  maxTravelKm: 20,
  responseTimeHours: 4,
  createdAt: '2024-01-01T00:00:00Z',
  skills: ['hardware'],
  services: [],
}

function makeRequest(id: string) {
  const req = new NextRequest(`http://localhost/api/technicians/${id}`)
  return { req, context: { params: Promise.resolve({ id }) } }
}

beforeEach(() => {
  jest.resetAllMocks()
})

// ============================================================================
// GET — single technician
// ============================================================================

describe('GET /api/technicians/[id]', () => {
  it('returns 400 for non-UUID id', async () => {
    const { req, context } = makeRequest('not-a-uuid')
    const response = await GET(req, context)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(mockGetTechnicianById).not.toHaveBeenCalled()
  })

  it('returns 400 for numeric id', async () => {
    const { req, context } = makeRequest('12345')
    const response = await GET(req, context)
    expect(response.status).toBe(400)
  })

  it('returns 404 when technician is not found', async () => {
    mockGetTechnicianById.mockResolvedValue(null)
    const { req, context } = makeRequest(VALID_UUID)
    const response = await GET(req, context)
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.success).toBe(false)
  })

  it('returns 200 with technician profile', async () => {
    mockGetTechnicianById.mockResolvedValue(MOCK_TECHNICIAN)
    const { req, context } = makeRequest(VALID_UUID)
    const response = await GET(req, context)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.technician.id).toBe(VALID_UUID)
    expect(body.data.technician.name).toBe('Anna Muster')
  })

  it('calls getTechnicianById with the correct id', async () => {
    mockGetTechnicianById.mockResolvedValue(MOCK_TECHNICIAN)
    const { req, context } = makeRequest(VALID_UUID)
    await GET(req, context)
    expect(mockGetTechnicianById).toHaveBeenCalledWith(VALID_UUID)
  })

  it('returns 500 when service throws', async () => {
    mockGetTechnicianById.mockRejectedValue(new Error('DB error'))
    const { req, context } = makeRequest(VALID_UUID)
    const response = await GET(req, context)
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})
