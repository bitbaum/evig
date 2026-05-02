/**
 * @jest-environment node
 *
 * Tests for GET + POST /api/messages/conversations
 *
 * GET: List conversations (with other_participant enrichment)
 * POST: Create a conversation (optionally with an initial message)
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

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => {
      mockInsert(...args)
      return { values: mockValues }
    },
  },
}))

const mockValidateBody = jest.fn()
jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
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
    parsePagination: () => ({ limit: 20, offset: 0 }),
  }
})

jest.mock('@/lib/messaging/send-message', () => ({
  sendMessageInConversation: jest.fn().mockResolvedValue({
    conversationId: 'conv-1',
    messageId: 'msg-1',
  }),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: { USERS: 'users' },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Server error' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  desc: (a: unknown) => ({ __desc: a }),
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
  users: { id: 'u_id', name: 'u_name', email: 'u_email', role: 'u_role' },
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

const MOCK_CONV_ROW = {
  id: 'conv-1',
  participant_1: 'user-1',
  participant_2: 'user-2',
  type: 'marketplace',
  context_id: 'listing-1',
  title: 'Dell Laptop',
  last_message_preview: 'Ist noch verfügbar?',
  last_message_at: new Date(),
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  unread_count_1: 0,
  unread_count_2: 1,
  other_participant: { id: 'user-2', name: 'Test Seller', email: 'seller@example.com', role: 'user' },
  unread_count: 1,
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeChain(terminal: 'where' | 'offset' | 'limit' | 'returning', result: unknown[]) {
  const terminalFn = jest.fn().mockResolvedValue(result)
  const chain: Record<string, unknown> = {}
  chain.from = jest.fn().mockReturnValue(chain)
  chain.innerJoin = jest.fn().mockReturnValue(chain)
  chain.leftJoin = jest.fn().mockReturnValue(chain)
  chain.where = terminal === 'where' ? terminalFn : jest.fn().mockReturnValue(chain)
  chain.orderBy = jest.fn().mockReturnValue(chain)
  chain.limit = terminal === 'limit' ? terminalFn : jest.fn().mockReturnValue(chain)
  chain.offset = terminal === 'offset' ? terminalFn : jest.fn().mockReturnValue(chain)
  chain.returning = terminal === 'returning' ? terminalFn : jest.fn().mockReturnValue(chain)
  chain.as = jest.fn().mockReturnValue(chain)
  return chain
}

function makeRequest(method = 'GET', body?: unknown) {
  return new Request('http://localhost/api/messages/conversations', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { GET, POST } from '../route'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
})

describe('GET /api/messages/conversations', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(401)
  })

  it('returns 200 with conversations list', async () => {
    mockSelect.mockReturnValue(makeChain('offset', [MOCK_CONV_ROW]))
    const res = await GET(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data.conversations)).toBe(true)
    expect(body.data.conversations).toHaveLength(1)
  })

  it('returns 200 with empty list when no conversations exist', async () => {
    mockSelect.mockReturnValue(makeChain('offset', []))
    const res = await GET(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.conversations).toHaveLength(0)
  })
})

describe('POST /api/messages/conversations', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest('POST', { participantId: 'user-2', type: 'marketplace' }) as never)
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

  it('returns 200 with conversationId when initial message is provided', async () => {
    mockValidateBody.mockReturnValue({
      success: true,
      data: {
        participantId: 'user-2',
        type: 'marketplace',
        contextId: 'listing-1',
        initialMessage: 'Hallo, ist das noch verfügbar?',
      },
    })
    const res = await POST(makeRequest('POST', {}) as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.conversation.id).toBe('conv-1')
    expect(body.data.message_id).toBe('msg-1')
  })

  it('returns 200 with existing conversation when no initial message', async () => {
    mockValidateBody.mockReturnValue({
      success: true,
      data: { participantId: 'user-2', type: 'marketplace', contextId: null, initialMessage: null },
    })
    // select returns existing conversation
    mockSelect.mockReturnValue(makeChain('where', [{ id: 'conv-existing' }]))
    const res = await POST(makeRequest('POST', {}) as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.conversation.id).toBe('conv-existing')
  })
})
