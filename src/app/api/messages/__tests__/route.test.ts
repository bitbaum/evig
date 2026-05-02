/**
 * @jest-environment node
 *
 * Tests for GET + POST /api/messages
 *
 * GET: List conversations for the authenticated user
 * POST: Send a message (creates or reuses a conversation)
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
  parsePagination: () => ({ limit: 20, offset: 0 }),
}))

const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

const mockValidateBody = jest.fn()
jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  SendMessageSchema: {},
  CreateConversationSchema: {},
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
    parsePagination: () => ({ limit: 50, offset: 0 }),
  }
})

jest.mock('@/lib/messaging/send-message', () => ({
  sendMessageInConversation: jest.fn().mockResolvedValue({
    conversationId: 'conv-1',
    messageId: 'msg-1',
    createdAt: new Date().toISOString(),
  }),
}))

jest.mock('@/lib/email', () => ({
  sendCustomEmail: jest.fn().mockResolvedValue(undefined),
  newMarketplaceMessage: jest.fn().mockReturnValue({}),
}))

jest.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: { messageCreate: jest.fn().mockReturnValue(true) },
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Server error' },
}))

jest.mock('@/config/urls', () => ({ APP_URL: 'https://example.com' }))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  desc: (a: unknown) => ({ __desc: a }),
  asc: (a: unknown) => ({ __asc: a }),
}))

jest.mock('@/db/schema', () => ({
  conversations: {
    id: 'c_id',
    participant1: 'c_p1',
    participant2: 'c_p2',
    type: 'c_type',
    contextId: 'c_contextId',
    title: 'c_title',
    lastMessagePreview: 'c_lmp',
    lastMessageAt: 'c_lma',
    isActive: 'c_isActive',
    createdAt: 'c_createdAt',
    updatedAt: 'c_updatedAt',
    unreadCount1: 'c_uc1',
    unreadCount2: 'c_uc2',
  },
  messages: {
    id: 'm_id',
    conversationId: 'm_convId',
    senderId: 'm_senderId',
    recipientId: 'm_recipientId',
    content: 'm_content',
    messageType: 'm_type',
    isRead: 'm_isRead',
    createdAt: 'm_createdAt',
  },
  users: {
    id: 'u_id',
    name: 'u_name',
    email: 'u_email',
    role: 'u_role',
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

const MOCK_CONV = {
  id: 'conv-1',
  participant1: 'user-1',
  participant2: 'user-2',
  type: 'marketplace',
  contextId: 'listing-1',
  title: 'Dell Laptop',
  lastMessagePreview: 'Ist noch verfügbar?',
  lastMessageAt: new Date(),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  unreadCount1: 0,
  unreadCount2: 1,
  otherUserName: 'Test Seller',
  otherUserId: 'user-2',
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeChain(terminal: 'where' | 'offset' | 'limit', result: unknown[]) {
  const terminalFn = jest.fn().mockResolvedValue(result)
  const chain: Record<string, unknown> = {}
  chain.from = jest.fn().mockReturnValue(chain)
  chain.innerJoin = jest.fn().mockReturnValue(chain)
  chain.leftJoin = jest.fn().mockReturnValue(chain)
  chain.where = terminal === 'where' ? terminalFn : jest.fn().mockReturnValue(chain)
  chain.orderBy = jest.fn().mockReturnValue(chain)
  chain.limit = terminal === 'limit' ? terminalFn : jest.fn().mockReturnValue(chain)
  chain.offset = terminal === 'offset' ? terminalFn : jest.fn().mockReturnValue(chain)
  chain.as = jest.fn().mockReturnValue(chain)
  return chain
}

function makeRequest(method = 'GET', body?: unknown) {
  return new Request('http://localhost/api/messages', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

// ---------------------------------------------------------------------------
// Import under test (after mocks are set up)
// ---------------------------------------------------------------------------

import { GET, POST } from '../route'
import { rateLimiters } from '@/lib/security/rate-limit'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockValues.mockResolvedValue([])
  mockReturning.mockResolvedValue([])
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue([])
})

describe('GET /api/messages', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(401)
  })

  it('returns 200 with conversations for authenticated user', async () => {
    mockSelect.mockReturnValue(makeChain('offset', [MOCK_CONV]))
    const res = await GET(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data.conversations)).toBe(true)
    expect(body.data.conversations).toHaveLength(1)
  })

  it('returns 200 with empty conversations list', async () => {
    mockSelect.mockReturnValue(makeChain('offset', []))
    const res = await GET(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.conversations).toHaveLength(0)
  })
})

describe('POST /api/messages', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest('POST', { recipient_id: 'user-2', content: 'Hi' }) as never)
    expect(res.status).toBe(401)
  })

  it('returns 400 when validation fails', async () => {
    mockValidateBody.mockReturnValue({
      success: false,
      error: new Response(JSON.stringify({ success: false, error: 'Ungültige Eingabedaten' }), { status: 400 }),
    })
    const res = await POST(makeRequest('POST', {}) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when rate limited', async () => {
    ;(rateLimiters.messageCreate as jest.Mock).mockReturnValue(false)
    mockValidateBody.mockReturnValue({
      success: true,
      data: { recipient_id: 'user-2', content: 'Hi', context_id: null, context_type: 'marketplace' },
    })
    const res = await POST(makeRequest('POST', { recipient_id: 'user-2', content: 'Hi' }) as never)
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it('returns 200 with conversationId and messageId on success', async () => {
    ;(rateLimiters.messageCreate as jest.Mock).mockReturnValue(true)
    mockValidateBody.mockReturnValue({
      success: true,
      data: { recipient_id: 'user-2', content: 'Hallo!', context_id: 'listing-1', context_type: 'marketplace' },
    })
    // Fire-and-forget email lookup
    mockSelect.mockReturnValue(makeChain('limit', [{ email: 'other@example.com', name: 'Other' }]))

    const res = await POST(makeRequest('POST', { recipient_id: 'user-2', content: 'Hallo!' }) as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.conversation_id).toBe('conv-1')
    expect(body.data.message_id).toBe('msg-1')
  })
})
