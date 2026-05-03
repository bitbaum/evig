/**
 * @jest-environment node
 *
 * Tests for POST /api/ai/extract
 *
 * Behaviors locked:
 *   POST - 401 (unauthenticated), 400 (invalid JSON), 400 (invalid formType),
 *          400 (text too short), 403 (staff-only formType for non-staff),
 *          200 (successful extraction with result from registryExtract)
 */

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

const mockRegistryExtract = jest.fn()
jest.mock('@/lib/ai/extract', () => ({
  registryExtract: (...args: unknown[]) => mockRegistryExtract(...args),
}))

// Mock FORM_AI_REGISTRY with known test forms
jest.mock('@/lib/ai/config/prompts', () => ({
  FORM_AI_REGISTRY: {
    'erfassung': { auth: 'user', systemPrompt: 'You help with erfassung', userPromptTemplate: '{text}' },
    'protocol': { auth: 'staff', systemPrompt: 'You help with protocols', userPromptTemplate: '{text}' },
  },
}))

jest.mock('@/lib/permissions', () => ({
  isStaffEmail: (email: string) => email.endsWith('@revamp-it.ch'),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, details?: unknown) => NextResponse.json({ success: false, error: msg, details }, { status: 400 }),
    apiForbidden: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 403 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const STAFF_SESSION = {
  user: { id: 'staff-1', email: 'staff@revamp-it.ch', name: 'Staff', isStaff: true, staffPermissions: ['*'] },
  expires: '2027-01-01',
}

const MOCK_EXTRACT_RESULT = {
  success: true,
  data: { produktname: 'ThinkPad', hersteller: 'Lenovo' },
  model: 'groq/llama3',
  confidence: 0.9,
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/ai/extract', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockRegistryExtract.mockResolvedValue(MOCK_EXTRACT_RESULT)
})

// ============================================================================
// Unauthenticated
// ============================================================================

describe('POST /api/ai/extract — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest({ formType: 'erfassung', text: 'Some product description text here' })
    const response = await POST(req)
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// Validation — JSON parsing
// ============================================================================

describe('POST /api/ai/extract — invalid JSON', () => {
  it('returns 400 when body is not valid JSON', async () => {
    const req = makeRequest('not-valid-json{')
    const response = await POST(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })
})

// ============================================================================
// Validation — schema
// ============================================================================

describe('POST /api/ai/extract — validation', () => {
  it('returns 400 when formType is missing', async () => {
    const req = makeRequest({ text: 'Some product description text here' })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when formType is not in registry', async () => {
    const req = makeRequest({ formType: 'nonexistent_form', text: 'Some text here' })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when text is too short (less than 3 chars)', async () => {
    const req = makeRequest({ formType: 'erfassung', text: 'ab' })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when text is too long (more than 5000 chars)', async () => {
    const req = makeRequest({ formType: 'erfassung', text: 'x'.repeat(5001) })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// Staff-only forms
// ============================================================================

describe('POST /api/ai/extract — staff-only access', () => {
  it('returns 403 when non-staff user tries to use a staff-only formType', async () => {
    const req = makeRequest({ formType: 'protocol', text: 'Protocol notes to extract data from here' })
    const response = await POST(req)
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toMatch(/staff/i)
  })

  it('allows staff user to use staff-only formType', async () => {
    mockAuth.mockResolvedValueOnce(STAFF_SESSION)
    const req = makeRequest({ formType: 'protocol', text: 'Protocol notes to extract data from here' })
    const response = await POST(req)
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// Success
// ============================================================================

describe('POST /api/ai/extract — success', () => {
  it('returns 200 with extraction result', async () => {
    const req = makeRequest({ formType: 'erfassung', text: 'ThinkPad X1 Carbon by Lenovo, 16GB RAM' })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.produktname).toBe('ThinkPad')
    expect(mockRegistryExtract).toHaveBeenCalledWith(
      expect.objectContaining({ formType: 'erfassung', text: 'ThinkPad X1 Carbon by Lenovo, 16GB RAM' })
    )
  })

  it('passes optional mode parameter to registryExtract', async () => {
    const req = makeRequest({ formType: 'erfassung', text: 'Some text here', mode: 'generate' })
    const response = await POST(req)
    expect(response.status).toBe(200)
    expect(mockRegistryExtract).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'generate' })
    )
  })

  it('passes optional currentData and instruction to registryExtract', async () => {
    const req = makeRequest({
      formType: 'erfassung',
      text: 'Some text here',
      currentData: { brand: 'Lenovo' },
      instruction: 'Focus on the RAM',
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    expect(mockRegistryExtract).toHaveBeenCalledWith(
      expect.objectContaining({
        currentData: { brand: 'Lenovo' },
        instruction: 'Focus on the RAM',
      })
    )
  })
})

// ============================================================================
// Error handling
// ============================================================================

describe('POST /api/ai/extract — errors', () => {
  it('returns 500 when registryExtract throws', async () => {
    mockRegistryExtract.mockRejectedValueOnce(new Error('AI service down'))
    const req = makeRequest({ formType: 'erfassung', text: 'Some text here' })
    const response = await POST(req)
    expect(response.status).toBe(500)
  })
})
