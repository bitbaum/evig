/**
 * @jest-environment node
 *
 * Tests for GET + PUT /api/user/profile
 *
 * GET: Return existing profile, or create one if not found
 * PUT: Validate + update profile fields
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
const mockReturning = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockUpdateReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => {
      mockInsert(...args)
      return { values: mockValues }
    },
    update: (...args: unknown[]) => {
      mockUpdate(...args)
      return { set: mockSet }
    },
  },
}))

const mockValidateBody = jest.fn()
jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  UpdateProfileSchema: {},
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

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}))

jest.mock('@/db/schema/auth', () => ({
  userProfiles: {
    userId: 'up_userId',
    bio: 'up_bio',
    avatarUrl: 'up_avatarUrl',
    location: 'up_location',
    phone: 'up_phone',
    updatedAt: 'up_updatedAt',
    firstName: 'up_firstName',
    lastName: 'up_lastName',
    companyName: 'up_companyName',
    mobile: 'up_mobile',
    addressLine1: 'up_addressLine1',
    addressLine2: 'up_addressLine2',
    postalCode: 'up_postalCode',
    city: 'up_city',
    canton: 'up_canton',
    country: 'up_country',
    interests: 'up_interests',
    preferredLanguage: 'up_preferredLanguage',
    newsletterSubscribed: 'up_newsletterSubscribed',
    isSupporter: 'up_isSupporter',
    supporterType: 'up_supporterType',
    displayName: 'up_displayName',
    profileVisibility: 'up_profileVisibility',
    showEmail: 'up_showEmail',
    showPhone: 'up_showPhone',
    emailNotifications: 'up_emailNotifications',
    smsNotifications: 'up_smsNotifications',
    marketplaceUpdates: 'up_marketplaceUpdates',
    workshopReminders: 'up_workshopReminders',
    $inferSelect: {} as Record<string, unknown>,
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

const MOCK_PROFILE = {
  userId: 'user-1',
  bio: 'I repair laptops',
  avatarUrl: null,
  location: 'Zürich',
  phone: null,
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeChain(terminal: 'where' | 'returning', result: unknown[]) {
  const terminalFn = jest.fn().mockResolvedValue(result)
  const chain: Record<string, unknown> = {}
  chain.from = jest.fn().mockReturnValue(chain)
  chain.where = terminal === 'where' ? terminalFn : jest.fn().mockReturnValue(chain)
  chain.returning = terminal === 'returning' ? terminalFn : jest.fn().mockReturnValue(chain)
  chain.set = jest.fn().mockReturnValue(chain)
  chain.as = jest.fn().mockReturnValue(chain)
  return chain
}

function makeRequest(method = 'GET', body?: unknown) {
  return new Request('http://localhost/api/user/profile', {
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
  mockReturning.mockResolvedValue([MOCK_PROFILE])
  mockValues.mockReturnValue({ returning: mockReturning })
  mockUpdateReturning.mockResolvedValue([MOCK_PROFILE])
  mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning })
  mockSet.mockReturnValue({ where: mockUpdateWhere })
})

describe('GET /api/user/profile', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(401)
  })

  it('returns 200 with existing profile', async () => {
    mockSelect.mockReturnValue(makeChain('where', [MOCK_PROFILE]))
    const res = await GET(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.profile.userId).toBe('user-1')
  })

  it('creates and returns profile when none exists', async () => {
    // First select returns empty → insert is triggered
    const selectChain = makeChain('where', [])
    mockSelect.mockReturnValueOnce(selectChain)
    mockValues.mockReturnValue({ returning: jest.fn().mockResolvedValue([MOCK_PROFILE]) })

    const res = await GET(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.profile).toBeTruthy()
  })
})

describe('PUT /api/user/profile', () => {
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

  it('returns 200 with updated profile on success', async () => {
    mockValidateBody.mockReturnValue({
      success: true,
      data: { bio: 'Updated bio' },
    })
    // getOrCreateProfileDrizzle (ensure exists) → returns profile
    mockSelect.mockReturnValue(makeChain('where', [MOCK_PROFILE]))

    const updatedProfile = { ...MOCK_PROFILE, bio: 'Updated bio' }
    mockUpdateReturning.mockResolvedValue([updatedProfile])

    const res = await PUT(makeRequest('PUT', { bio: 'Updated bio' }) as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.profile).toBeTruthy()
  })
})
