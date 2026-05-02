/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/hirn/chat
 *
 * Behaviors locked:
 *   POST /api/admin/hirn/chat
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 200 with AI response content
 *   - returns 500 when chat service throws
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

const mockChat = jest.fn()

jest.mock('@/lib/hirn', () => ({
  chat: (...args: unknown[]) => mockChat.apply(null, args),
}))

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  HirnChatSchema: {},
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_CHAT_RESPONSE = {
  content: 'Die Reparatur läuft gut.',
  actions: [],
  usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
  model: 'llama-3.3-70b',
  provider: 'groq',
}

function makeRequest(body: Record<string, unknown> = { message: 'Wie läuft es?', sessionId: 'sess-1' }) {
  return new NextRequest('http://localhost/api/admin/hirn/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockChat.mockResolvedValue(MOCK_CHAT_RESPONSE)
  mockValidateBody.mockReturnValue({
    success: true,
    data: { message: 'Wie läuft es?', sessionId: 'sess-1' },
  })
})

// ============================================================================
// POST /api/admin/hirn/chat
// ============================================================================

describe('POST /api/admin/hirn/chat — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/hirn/chat — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/admin/hirn/chat — success', () => {
  it('returns 200 with AI response content', async () => {
    const response = await POST(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.content).toBe('Die Reparatur läuft gut.')
    expect(body.data.provider).toBe('groq')
  })

  it('returns 200 with empty actions array when response has no actions', async () => {
    mockChat.mockResolvedValueOnce({ ...MOCK_CHAT_RESPONSE, actions: undefined })
    const response = await POST(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.actions).toEqual([])
  })

  it('returns 500 when chat service throws', async () => {
    mockChat.mockRejectedValueOnce(new Error('AI unavailable'))
    const response = await POST(makeRequest())
    expect(response.status).toBe(500)
  })
})
