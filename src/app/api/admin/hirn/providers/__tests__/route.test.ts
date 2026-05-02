/**
 * @jest-environment node
 *
 * Tests for GET/PATCH /api/admin/hirn/providers
 *
 * Behaviors locked:
 *   GET /api/admin/hirn/providers
 *   - returns 401 when not authenticated
 *   - returns 200 with provider list including availability
 *   - marks provider unavailable when createProvider throws
 *   - returns 500 when getProviderSettings throws
 *
 *   PATCH /api/admin/hirn/providers
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 404 when provider not found
 *   - returns 400 when setting disabled provider as default
 *   - returns 400 when provider is not available for default
 *   - returns 200 on success
 *   - returns 500 when service throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler
    return (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return (handler as (r: Request, s: unknown) => unknown)(req, session)
      })
  },
}))

const mockGetProviderSettings = jest.fn()
const mockSetDefaultProvider = jest.fn()
const mockCreateProvider = jest.fn()
const mockUpdateProviderSettings = jest.fn()
const mockSetProviderEnabled = jest.fn()
const mockIsAvailable = jest.fn()

jest.mock('@/lib/hirn/providers', () => ({
  getProviderSettings: (...args: unknown[]) => mockGetProviderSettings.apply(null, args),
  setDefaultProvider: (...args: unknown[]) => mockSetDefaultProvider.apply(null, args),
  createProvider: (...args: unknown[]) => mockCreateProvider.apply(null, args),
  updateProviderSettings: (...args: unknown[]) => mockUpdateProviderSettings.apply(null, args),
  setProviderEnabled: (...args: unknown[]) => mockSetProviderEnabled.apply(null, args),
}))

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  HirnProviderUpdateSchema: {},
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (entity: string) =>
      NextResponse.json({ success: false, error: `${entity} not found` }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, PATCH } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_PROVIDER_SETTINGS = [
  { provider: 'groq', is_enabled: true, is_default: true, settings: { model: 'llama-3.3-70b', description: 'Groq fast' } },
  { provider: 'ollama', is_enabled: false, is_default: false, settings: { model: 'llama3.2', base_url: 'http://localhost:11434', description: 'Local' } },
]

function makeGetRequest() {
  return new NextRequest('http://localhost/api/admin/hirn/providers', { method: 'GET' })
}

function makePatchRequest(body: Record<string, unknown> = { provider: 'groq', isDefault: true }) {
  return new NextRequest('http://localhost/api/admin/hirn/providers', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockIsAvailable.mockResolvedValue(true)
  mockCreateProvider.mockReturnValue({ isAvailable: mockIsAvailable })
  mockGetProviderSettings.mockResolvedValue(MOCK_PROVIDER_SETTINGS)
  mockUpdateProviderSettings.mockResolvedValue(undefined)
  mockSetProviderEnabled.mockResolvedValue(undefined)
  mockSetDefaultProvider.mockResolvedValue(undefined)
  mockValidateBody.mockReturnValue({
    success: true,
    data: { provider: 'groq', isDefault: true },
  })
})

// ============================================================================
// GET /api/admin/hirn/providers
// ============================================================================

describe('GET /api/admin/hirn/providers — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/hirn/providers — authenticated', () => {
  it('returns 200 with provider list including availability', async () => {
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0].provider).toBe('groq')
    expect(body.data[0].isAvailable).toBe(true)
  })

  it('marks provider unavailable when createProvider throws', async () => {
    mockCreateProvider.mockImplementationOnce(() => { throw new Error('provider error') })
    mockCreateProvider.mockReturnValue({ isAvailable: mockIsAvailable })
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data[0].isAvailable).toBe(false)
    expect(body.data[1].isAvailable).toBe(true)
  })

  it('returns 500 when getProviderSettings throws', async () => {
    mockGetProviderSettings.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(500)
  })
})

// ============================================================================
// PATCH /api/admin/hirn/providers
// ============================================================================

describe('PATCH /api/admin/hirn/providers — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makePatchRequest())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/admin/hirn/providers — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await PATCH(makePatchRequest({}))
    expect(response.status).toBe(400)
  })

  it('returns 404 when provider not found in settings', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { provider: 'nonexistent', isDefault: false },
    })
    const response = await PATCH(makePatchRequest({ provider: 'nonexistent' }))
    expect(response.status).toBe(404)
  })

  it('returns 400 when setting disabled provider as default', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { provider: 'ollama', isDefault: true, isEnabled: false },
    })
    const response = await PATCH(makePatchRequest({ provider: 'ollama', isDefault: true, isEnabled: false }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when provider is not available for default', async () => {
    mockIsAvailable.mockResolvedValueOnce(false)
    const response = await PATCH(makePatchRequest({ provider: 'groq', isDefault: true }))
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/admin/hirn/providers — success', () => {
  it('returns 200 on success', async () => {
    const response = await PATCH(makePatchRequest({ provider: 'groq', isDefault: true }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.message).toMatch(/aktualisiert/i)
  })

  it('calls updateProviderSettings when apiKey is provided', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { provider: 'groq', apiKey: 'test-key', isDefault: false },
    })
    const response = await PATCH(makePatchRequest({ provider: 'groq', apiKey: 'test-key' }))
    expect(response.status).toBe(200)
    expect(mockUpdateProviderSettings).toHaveBeenCalledWith('groq', { api_key: 'test-key' }, 'system')
  })

  it('calls setProviderEnabled when isEnabled is provided', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { provider: 'groq', isEnabled: false, isDefault: false },
    })
    const response = await PATCH(makePatchRequest({ provider: 'groq', isEnabled: false }))
    expect(response.status).toBe(200)
    expect(mockSetProviderEnabled).toHaveBeenCalledWith('groq', false, 'system')
  })

  it('returns 500 when service throws', async () => {
    mockGetProviderSettings.mockRejectedValueOnce(new Error('DB error'))
    const response = await PATCH(makePatchRequest())
    expect(response.status).toBe(500)
  })
})
