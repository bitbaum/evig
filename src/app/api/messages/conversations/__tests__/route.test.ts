/**
 * @vitest-environment node
 *
 * Tests for GET + POST /api/messages/conversations
 *
 * GET: List conversations (with other_participant enrichment)
 * POST: Create a conversation (optionally with an initial message)
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/api/middleware', async () => ({
  withAuth: (handler: unknown) => (req: Request, context?: { params?: Promise<unknown> }) =>
    mockAuth().then(async (session: unknown) => {
      if (!session || !(session as { user?: { id?: string } }).user?.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const resolvedContext = context?.params ? { params: await context.params } : undefined;
      return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext);
    }),
  parsePagination: () => ({ limit: 20, offset: 0 }),
}));

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return { values: mockValues };
    },
  },
}));

const mockValidateBody = vi.fn();
vi.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
  CreateConversationSchema: {},
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    parsePagination: () => ({ limit: 20, offset: 0 }),
  };
});

vi.mock('@/lib/messaging/send-message', () => ({
  sendMessageInConversation: vi.fn().mockResolvedValue({
    conversationId: 'conv-1',
    messageId: 'msg-1',
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/config/database', () => ({
  TABLE_NAMES: { USERS: 'users' },
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Server error' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  desc: (a: unknown) => ({ __desc: a }),
}));

vi.mock('@/db/schema', () => ({
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
}));

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
};

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
  other_participant: {
    id: 'user-2',
    name: 'Test Seller',
    email: 'seller@example.com',
    role: 'user',
  },
  unread_count: 1,
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeChain(terminal: 'where' | 'offset' | 'limit' | 'returning', result: unknown[]) {
  const terminalFn = vi.fn().mockResolvedValue(result);
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.leftJoin = vi.fn().mockReturnValue(chain);
  chain.where = terminal === 'where' ? terminalFn : vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.limit = terminal === 'limit' ? terminalFn : vi.fn().mockReturnValue(chain);
  chain.offset = terminal === 'offset' ? terminalFn : vi.fn().mockReturnValue(chain);
  chain.returning = terminal === 'returning' ? terminalFn : vi.fn().mockReturnValue(chain);
  chain.as = vi.fn().mockReturnValue(chain);
  return chain;
}

function makeRequest(method = 'GET', body?: unknown) {
  return new Request('http://localhost/api/messages/conversations', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import { GET, POST } from '../route';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
});

describe('GET /api/messages/conversations', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest() as never);
    expect(res.status).toBe(401);
  });

  it('returns 200 with conversations list', async () => {
    mockSelect.mockReturnValue(makeChain('offset', [MOCK_CONV_ROW]));
    const res = await GET(makeRequest() as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.conversations)).toBe(true);
    expect(body.data.conversations).toHaveLength(1);
  });

  it('returns 200 with empty list when no conversations exist', async () => {
    mockSelect.mockReturnValue(makeChain('offset', []));
    const res = await GET(makeRequest() as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.conversations).toHaveLength(0);
  });
});

describe('POST /api/messages/conversations', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(
      makeRequest('POST', { participantId: 'user-2', type: 'marketplace' }) as never,
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 when validation fails', async () => {
    mockValidateBody.mockReturnValue({
      success: false,
      error: new Response(JSON.stringify({ success: false, error: 'Ungültige Eingabedaten' }), {
        status: 400,
      }),
    });
    const res = await POST(makeRequest('POST', {}) as never);
    expect(res.status).toBe(400);
  });

  it('returns 200 with conversationId when initial message is provided', async () => {
    mockValidateBody.mockReturnValue({
      success: true,
      data: {
        participantId: 'user-2',
        type: 'marketplace',
        contextId: 'listing-1',
        initialMessage: 'Hallo, ist das noch verfügbar?',
      },
    });
    const res = await POST(makeRequest('POST', {}) as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.conversation.id).toBe('conv-1');
    expect(body.data.message_id).toBe('msg-1');
  });

  it('returns 200 with existing conversation when no initial message', async () => {
    mockValidateBody.mockReturnValue({
      success: true,
      data: { participantId: 'user-2', type: 'marketplace', contextId: null, initialMessage: null },
    });
    // select returns existing conversation
    mockSelect.mockReturnValue(makeChain('where', [{ id: 'conv-existing' }]));
    const res = await POST(makeRequest('POST', {}) as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.conversation.id).toBe('conv-existing');
  });
});
