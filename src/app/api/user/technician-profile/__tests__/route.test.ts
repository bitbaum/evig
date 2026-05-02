/**
 * @jest-environment node
 *
 * Tests for GET + PUT /api/user/technician-profile
 *
 * GET: Return technician profile + skills for the authenticated user
 * PUT: Upsert profile and replace skills
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: unknown) =>
    (req: Request, context?: { params?: Promise<unknown> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext)
      }),
}))

const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockOnConflictDoUpdate = jest.fn()
const mockDelete = jest.fn()
const mockDeleteWhere = jest.fn()
const mockInsert2 = jest.fn()
const mockValues2 = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => {
      mockInsert(...args)
      return { values: mockValues }
    },
    delete: (...args: unknown[]) => {
      mockDelete(...args)
      return { where: mockDeleteWhere }
    },
  },
}))

const mockValidateBody = jest.fn()
jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  TechnicianProfileSchema: {},
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Server error' },
}))

jest.mock('@/config/repairer-status', () => ({
  REPAIRER_STATUS: { ACTIVE: 'active' },
  REPAIRER_PROFILE_TIER: { COMMUNITY: 'community', PROFESSIONAL: 'professional' },
}))

jest.mock('@/config/it-hilfe', () => ({
  IT_SKILLS: {
    networking: [{ id: 'networking', label: 'Netzwerk' }],
    hardware: [{ id: 'hardware', label: 'Hardware' }],
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}))

jest.mock('@/db/schema', () => ({
  repairerProfiles: {
    id: 'rp_id',
    userId: 'rp_userId',
    description: 'rp_description',
    hourlyRateCents: 'rp_hourlyRateCents',
    acceptsGratis: 'rp_acceptsGratis',
    acceptsKulturlegi: 'rp_acceptsKulturlegi',
    serviceDeliveryTypes: 'rp_serviceDeliveryTypes',
    postalCode: 'rp_postalCode',
    city: 'rp_city',
    maxTravelKm: 'rp_maxTravelKm',
    isActive: 'rp_isActive',
    profileTier: 'rp_profileTier',
    phone: 'rp_phone',
    address: 'rp_address',
    status: 'rp_status',
  },
  userSkills: {
    userId: 'us_userId',
    skillId: 'us_skillId',
    categoryId: 'us_categoryId',
  },
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    isStaff: false,
    staffPermissions: [] as string[],
  },
  expires: '2027-01-01',
}

const MOCK_PROFILE_ROW = {
  bio: 'I fix hardware',
  hourlyRateCents: 5000,
  acceptsGratis: false,
  acceptsKulturlegi: true,
  serviceTypes: ['remote'],
  postalCode: '8001',
  city: 'Zürich',
  maxTravelKm: 20,
  isActive: true,
  profileTier: 'community',
}

const MOCK_SKILL_ROW = { skillId: 'networking', categoryId: 'networking' }

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeChain(terminal: 'where' | 'limit', result: unknown[]) {
  const terminalFn = jest.fn().mockResolvedValue(result)
  const chain: Record<string, unknown> = {}
  chain.from = jest.fn().mockReturnValue(chain)
  chain.leftJoin = jest.fn().mockReturnValue(chain)
  chain.where = terminal === 'where' ? terminalFn : jest.fn().mockReturnValue(chain)
  chain.orderBy = jest.fn().mockReturnValue(chain)
  chain.limit = terminal === 'limit' ? terminalFn : jest.fn().mockReturnValue(chain)
  chain.as = jest.fn().mockReturnValue(chain)
  return chain
}

function makeRequest(method = 'GET', body?: unknown) {
  return new Request('http://localhost/api/user/technician-profile', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { GET, PUT } from '../route'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockDeleteWhere.mockResolvedValue([])
  mockOnConflictDoUpdate.mockResolvedValue([])
  mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate })
})

describe('GET /api/user/technician-profile', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(401)
  })

  it('returns 200 with profile and skills when profile exists', async () => {
    let callCount = 0
    mockSelect.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChain('where', [MOCK_PROFILE_ROW])
      return makeChain('where', [MOCK_SKILL_ROW])
    })

    const res = await GET(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.profile).not.toBeNull()
    expect(body.data.hasProfile).toBe(true)
    expect(body.data.profile.skills).toContain('networking')
  })

  it('returns 200 with null profile when no profile exists', async () => {
    let callCount = 0
    mockSelect.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChain('where', []) // no profile
      return makeChain('where', []) // no skills
    })

    const res = await GET(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.profile).toBeNull()
    expect(body.data.hasProfile).toBe(false)
  })
})

describe('PUT /api/user/technician-profile', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await PUT(makeRequest('PUT', { bio: 'Hello' }) as never)
    expect(res.status).toBe(401)
  })

  it('returns 400 when validation fails', async () => {
    mockValidateBody.mockReturnValue({
      success: false,
      error: new Response(JSON.stringify({ success: false, error: 'Ungültige Eingabedaten' }), { status: 400 }),
    })
    const res = await PUT(makeRequest('PUT', {}) as never)
    expect(res.status).toBe(400)
  })

  it('returns 200 with success message after upsert', async () => {
    mockValidateBody.mockReturnValue({
      success: true,
      data: {
        skills: ['networking'],
        bio: 'Updated bio',
        hourlyRateCents: 6000,
        acceptsGratis: true,
        acceptsKulturlegi: false,
        serviceTypes: ['remote', 'in-person'],
        postalCode: '8001',
        city: 'Zürich',
        maxTravelKm: 30,
        isActive: true,
      },
    })

    // After delete, values is called for skill insert
    const mockInsertSkillValues = jest.fn().mockResolvedValue([])
    mockInsert.mockImplementation(() => undefined)
    mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate })
    // Second insert (skills)
    let insertCount = 0
    jest.spyOn(require('@/db').db, 'insert').mockImplementation((...args: unknown[]) => {
      insertCount++
      mockInsert(...args)
      if (insertCount === 1) {
        return { values: mockValues }
      }
      return { values: mockInsertSkillValues }
    })

    const res = await PUT(makeRequest('PUT', {}) as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.message).toBeTruthy()
  })
})
