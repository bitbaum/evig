/**
 * @jest-environment node
 *
 * Tests for GET /api/repairers/[id] (public)
 *
 * Behaviors locked:
 *   GET - 404 (not found), 200 with full repairer profile including services/reviews/availability
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
    businessName: 'rp_businessName',
    businessType: 'rp_businessType',
    description: 'rp_description',
    yearsExperience: 'rp_yearsExperience',
    phone: 'rp_phone',
    website: 'rp_website',
    address: 'rp_address',
    city: 'rp_city',
    postalCode: 'rp_postalCode',
    latitude: 'rp_latitude',
    longitude: 'rp_longitude',
    serviceRadiusKm: 'rp_serviceRadiusKm',
    remoteServices: 'rp_remoteServices',
    hourlyRateCents: 'rp_hourlyRateCents',
    emergencyFeeCents: 'rp_emergencyFeeCents',
    homeVisitFeeCents: 'rp_homeVisitFeeCents',
    averageRating: 'rp_averageRating',
    totalReviews: 'rp_totalReviews',
    totalJobsCompleted: 'rp_totalJobsCompleted',
    completionRate: 'rp_completionRate',
    servicesOffered: 'rp_servicesOffered',
    specializations: 'rp_specializations',
    certifications: 'rp_certifications',
    isVerified: 'rp_isVerified',
    verificationDate: 'rp_verificationDate',
    responseTimeHours: 'rp_responseTimeHours',
    typicalTurnaroundDays: 'rp_typicalTurnaroundDays',
    warrantyOffered: 'rp_warrantyOffered',
    warrantyDurationMonths: 'rp_warrantyDurationMonths',
    insuranceInfo: 'rp_insuranceInfo',
    portfolioImages: 'rp_portfolioImages',
    availabilitySchedule: 'rp_availabilitySchedule',
    status: 'rp_status',
    createdAt: 'rp_createdAt',
    isActive: 'rp_isActive',
  },
  repairerServices: {
    id: 'rs_id',
    repairerId: 'rs_repairerId',
    serviceCategory: 'rs_serviceCategory',
    serviceName: 'rs_serviceName',
    description: 'rs_description',
    basePriceCents: 'rs_basePriceCents',
    hourlyRateCents: 'rs_hourlyRateCents',
    partsIncluded: 'rs_partsIncluded',
    estimatedHours: 'rs_estimatedHours',
    estimatedDays: 'rs_estimatedDays',
    isActive: 'rs_isActive',
  },
  repairerReviews: {
    id: 'rr_id',
    repairerId: 'rr_repairerId',
    customerId: 'rr_customerId',
    rating: 'rr_rating',
    title: 'rr_title',
    comment: 'rr_comment',
    timelinessRating: 'rr_timelinessRating',
    qualityRating: 'rr_qualityRating',
    communicationRating: 'rr_communicationRating',
    isVerified: 'rr_isVerified',
    isPublic: 'rr_isPublic',
    repairerResponse: 'rr_repairerResponse',
    repairerResponseDate: 'rr_repairerResponseDate',
    createdAt: 'rr_createdAt',
  },
  repairerAvailability: {
    id: 'ra_id',
    repairerId: 'ra_repairerId',
    date: 'ra_date',
    startTime: 'ra_startTime',
    endTime: 'ra_endTime',
    availabilityType: 'ra_availabilityType',
  },
  users: {
    id: 'u_id',
    name: 'u_name',
    email: 'u_email',
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
  gte: (a: unknown, b: unknown) => ({ __gte: [a, b] }),
  lte: (a: unknown, b: unknown) => ({ __lte: [a, b] }),
  isNull: (a: unknown) => ({ __isNull: a }),
  isNotNull: (a: unknown) => ({ __isNotNull: a }),
  count: () => ({ __count: true }),
}))

jest.mock('@/config/repairer-status', () => ({
  REPAIRER_AVAILABILITY_TYPE: { AVAILABLE: 'available' },
}))

jest.mock('@/config/api-defaults', () => ({
  API_DEFAULTS: { RECENT_RATINGS_LIMIT: 10 },
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

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler',
    REPAIRER_NOT_FOUND: 'Reparateur nicht gefunden', },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

const MOCK_PROFILE = {
  id: 'rep-1',
  user_id: 'user-1',
  business_name: 'Muster Repair',
  business_type: 'individual',
  description: 'Top Reparaturen',
  years_experience: 5,
  phone: '+41791234567',
  website: null,
  address: 'Hauptstrasse 1',
  city: 'Bern',
  postal_code: '3000',
  latitude: null,
  longitude: null,
  service_radius_km: 20,
  remote_services: true,
  hourly_rate_cents: 8000,
  emergency_fee_cents: null,
  home_visit_fee_cents: null,
  average_rating: 4.5,
  total_reviews: 8,
  total_jobs_completed: 30,
  completion_rate: '97',
  services_offered: ['laptop'],
  specializations: [],
  certifications: [],
  is_verified: true,
  verification_date: null,
  response_time_hours: 2,
  typical_turnaround_days: 2,
  warranty_offered: true,
  warranty_duration_months: 3,
  insurance_info: null,
  portfolio_images: [],
  availability_schedule: null,
  status: 'active',
  created_at: new Date('2024-01-01'),
  user_name: 'Max Muster',
  user_email: 'max@example.com',
}

// Builds a full mock chain for a select: .from().leftJoin/innerJoin().where().orderBy().limit() → resolves value
function buildChain(resolveValue: unknown) {
  const mockLimit = jest.fn().mockResolvedValue(resolveValue)
  const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit, groupBy: jest.fn().mockReturnValue({ orderBy: jest.fn().mockReturnValue({ limit: mockLimit }) }) })
  const mockGroupBy = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
  const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy, groupBy: mockGroupBy, limit: mockLimit })
  const mockLeftJoin = jest.fn().mockReturnValue({ where: mockWhere, leftJoin: jest.fn().mockReturnValue({ where: mockWhere }) })
  const mockFrom = jest.fn().mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere, innerJoin: jest.fn().mockReturnValue({ where: mockWhere }) })
  return { from: mockFrom, where: mockWhere }
}

// The route makes 5+ sequential selects: profile, services, reviews, ratingDist+reviewSummary (Promise.all), availability
function setupSelectMocks({
  profile = [MOCK_PROFILE],
  services = [],
  reviews = [],
  ratingDist = [],
  reviewSummary = [{ avg_timeliness: '4.5', avg_quality: '4.5', avg_communication: '4.5' }],
  availability = [],
}: {
  profile?: unknown[]
  services?: unknown[]
  reviews?: unknown[]
  ratingDist?: unknown[]
  reviewSummary?: unknown[]
  availability?: unknown[]
} = {}) {
  let callCount = 0

  mockSelect.mockImplementation(() => {
    callCount++
    switch (callCount) {
      case 1: { // profile
        const mockWhere = jest.fn().mockResolvedValue(profile)
        const mockLeftJoin = jest.fn().mockReturnValue({ where: mockWhere })
        const mockFrom = jest.fn().mockReturnValue({ leftJoin: mockLeftJoin })
        return { from: mockFrom }
      }
      case 2: { // services
        const chain = buildChain(services)
        const mockWhere = jest.fn().mockReturnValue({ orderBy: jest.fn().mockResolvedValue(services) })
        const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
        return { from: mockFrom }
      }
      case 3: { // reviews
        const mockLimit = jest.fn().mockResolvedValue(reviews)
        const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit })
        const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
        const mockLeftJoin = jest.fn().mockReturnValue({ where: mockWhere })
        const mockFrom = jest.fn().mockReturnValue({ leftJoin: mockLeftJoin })
        return { from: mockFrom }
      }
      case 4: { // ratingDist (Promise.all[0])
        const mockOrderBy = jest.fn().mockResolvedValue(ratingDist)
        const mockGroupBy = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
        const mockWhere = jest.fn().mockReturnValue({ groupBy: mockGroupBy })
        const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
        return { from: mockFrom }
      }
      case 5: { // reviewSummary (Promise.all[1])
        const mockWhere = jest.fn().mockResolvedValue(reviewSummary)
        const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
        return { from: mockFrom }
      }
      case 6: { // availability
        const mockOrderBy = jest.fn().mockResolvedValue(availability)
        const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
        const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
        return { from: mockFrom }
      }
      default:
        return buildChain([]).from
    }
  })
}

function makeRequest(id: string) {
  const req = new NextRequest(`http://localhost/api/repairers/${id}`)
  return { req, context: { params: Promise.resolve({ id }) } }
}

beforeEach(() => {
  jest.resetAllMocks()
})

// ============================================================================
// GET — single repairer profile
// ============================================================================

describe('GET /api/repairers/[id]', () => {
  it('returns 404 when profile not found', async () => {
    setupSelectMocks({ profile: [] })
    const { req, context } = makeRequest('rep-999')
    const response = await GET(req, context)
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.success).toBe(false)
  })

  it('returns 200 with full repairer profile', async () => {
    setupSelectMocks()
    const { req, context } = makeRequest('rep-1')
    const response = await GET(req, context)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.repairer.id).toBe('rep-1')
    expect(body.data.repairer.user_name).toBe('Max Muster')
  })

  it('includes services, reviews, and availability in response', async () => {
    const services = [{ id: 'svc-1', service_name: 'Laptop Reparatur', service_category: 'laptop', description: null, base_price_cents: 5000, hourly_rate_cents: 8000, parts_included: false, estimated_hours: null, estimated_days: null, is_active: true }]
    const reviews = [{ id: 'rev-1', customer_name: 'Kunde', rating: 5, title: 'Super', comment: 'Toll', timeliness_rating: 5, quality_rating: 5, communication_rating: 5, is_verified: true, repairer_response: null, repairer_response_date: null, created_at: new Date() }]
    setupSelectMocks({ services, reviews })
    const { req, context } = makeRequest('rep-1')
    const response = await GET(req, context)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(Array.isArray(body.data.services)).toBe(true)
    expect(Array.isArray(body.data.reviews)).toBe(true)
    expect(Array.isArray(body.data.availability)).toBe(true)
  })

  it('maps reviews correctly (customer_name → reviewerName)', async () => {
    const reviews = [{
      id: 'rev-1',
      customer_name: 'Hans',
      rating: 4,
      title: 'Gut',
      comment: 'Sehr gut',
      timeliness_rating: 4,
      quality_rating: 4,
      communication_rating: 4,
      is_verified: false,
      repairer_response: null,
      repairer_response_date: null,
      created_at: new Date(),
    }]
    setupSelectMocks({ reviews })
    const { req, context } = makeRequest('rep-1')
    const response = await GET(req, context)
    const body = await response.json()
    expect(body.data.reviews[0].reviewerName).toBe('Hans')
    expect(body.data.reviews[0].response).toBeNull()
  })

  it('sets reviewerName to Anonym when customer_name is null', async () => {
    const reviews = [{
      id: 'rev-2',
      customer_name: null,
      rating: 3,
      title: null,
      comment: null,
      timeliness_rating: null,
      quality_rating: null,
      communication_rating: null,
      is_verified: false,
      repairer_response: null,
      repairer_response_date: null,
      created_at: new Date(),
    }]
    setupSelectMocks({ reviews })
    const { req, context } = makeRequest('rep-1')
    const response = await GET(req, context)
    const body = await response.json()
    expect(body.data.reviews[0].reviewerName).toBe('Anonym')
  })

  it('includes repairer_response in review when present', async () => {
    const reviews = [{
      id: 'rev-3',
      customer_name: 'Petra',
      rating: 5,
      title: 'Perfekt',
      comment: 'Alles super',
      timeliness_rating: 5,
      quality_rating: 5,
      communication_rating: 5,
      is_verified: true,
      repairer_response: 'Danke!',
      repairer_response_date: new Date(),
      created_at: new Date(),
    }]
    setupSelectMocks({ reviews })
    const { req, context } = makeRequest('rep-1')
    const response = await GET(req, context)
    const body = await response.json()
    expect(body.data.reviews[0].response).not.toBeNull()
    expect(body.data.reviews[0].response.content).toBe('Danke!')
  })

  it('returns 500 when DB throws', async () => {
    mockSelect.mockImplementation(() => { throw new Error('DB error') })
    const { req, context } = makeRequest('rep-1')
    const response = await GET(req, context)
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})
