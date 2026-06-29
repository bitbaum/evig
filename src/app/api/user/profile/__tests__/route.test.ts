/**
 * @jest-environment node
 *
 * Tests for GET + PUT /api/user/profile
 *
 * The route is a thin controller over the db-users DAL:
 *   GET → getOrCreateProfile (returns the snake_case profile the client reads)
 *   PUT → validateBody → updateProfile
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

const mockGetOrCreateProfile = jest.fn()
const mockUpdateProfile = jest.fn()
jest.mock('@/lib/auth/db-users', () => ({
  getOrCreateProfile: (...args: unknown[]) => mockGetOrCreateProfile(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    role: 'user',
    isStaff: false,
    staffPermissions: [] as string[],
  },
  expires: '2027-01-01',
}

// Snake_case — the shape db-users returns and the client reads.
const MOCK_PROFILE = {
  user_id: 'user-1',
  bio: 'I repair laptops',
  avatar_url: null,
  phone: null,
  first_name: 'Test',
}

function makeRequest(method = 'GET', body?: unknown) {
  return new Request('http://localhost/api/user/profile', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

import { GET, PUT } from '../route'

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockGetOrCreateProfile.mockResolvedValue(MOCK_PROFILE)
  mockUpdateProfile.mockResolvedValue(MOCK_PROFILE)
})

describe('GET /api/user/profile', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(401)
  })

  it('returns 200 with the snake_case profile + role from db-users', async () => {
    const res = await GET(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.profile.user_id).toBe('user-1')
    expect(body.data.role).toBe('user')
    expect(mockGetOrCreateProfile).toHaveBeenCalledWith('user-1')
  })

  it('returns 500 when the DAL throws', async () => {
    mockGetOrCreateProfile.mockRejectedValue(new Error('db down'))
    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(500)
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

  it('delegates to updateProfile and returns the result', async () => {
    mockValidateBody.mockReturnValue({ success: true, data: { bio: 'Updated bio' } })
    mockUpdateProfile.mockResolvedValue({ ...MOCK_PROFILE, bio: 'Updated bio' })

    const res = await PUT(makeRequest('PUT', { bio: 'Updated bio' }) as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.profile.bio).toBe('Updated bio')
    expect(mockUpdateProfile).toHaveBeenCalledWith('user-1', { bio: 'Updated bio' })
  })
})
