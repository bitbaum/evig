/**
 * @vitest-environment node
 *
 * Tests for GET /api/messages/[conversationId]
 *
 * Flow: Auth check → verify participant → fetch messages → mark as read
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
  parsePagination: () => ({ limit: 50, offset: 0 }),
}));

const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return { set: mockSet };
    },
  },
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiForbidden: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
    parsePagination: () => ({ limit: 50, offset: 0 }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Server error' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  lt: (a: unknown, b: unknown) => ({ __lt: [a, b] }),
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
    isActive: 'c_isActive',
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
    readAt: 'm_readAt',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
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
  participant1: 'user-1',
  participant2: 'user-2',
  contextId: 'listing-1',
  type: 'marketplace',
};

const MOCK_MESSAGE = {
  id: 'msg-1',
  conversationId: 'conv-1',
  sender_id: 'user-1',
  recipient_id: 'user-2',
  content: 'Hallo!',
  message_type: 'text',
  is_read: false,
  created_at: new Date(),
  sender_name: 'Test User',
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

type ChainTerminal = 'where' | 'limit' | 'offset';

function makeChain(terminal: ChainTerminal, result: unknown[]) {
  const terminalFn = vi.fn().mockResolvedValue(result);
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.leftJoin = vi.fn().mockReturnValue(chain);
  chain.where = terminal === 'where' ? terminalFn : vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.limit = terminal === 'limit' ? terminalFn : vi.fn().mockReturnValue(chain);
  chain.offset = terminal === 'offset' ? terminalFn : vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.as = vi.fn().mockReturnValue(chain);
  return chain;
}

function makeRequest(conversationId = 'conv-1') {
  const req = new Request(`http://localhost/api/messages/${conversationId}`);
  return {
    req,
    context: { params: Promise.resolve({ conversationId }) },
  };
}

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import { GET } from '../route';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  // Default: update chain for marking messages read
  mockSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdateWhere.mockResolvedValue([]);
});

describe('GET /api/messages/[conversationId]', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const { req, context } = makeRequest();
    const res = await GET(req as never, context as never);
    expect(res.status).toBe(401);
  });

  it('returns 404 when conversation is not found', async () => {
    // First select (conversation lookup) returns empty
    mockSelect.mockReturnValue(makeChain('where', []));
    const { req, context } = makeRequest();
    const res = await GET(req as never, context as never);
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not a participant', async () => {
    // Conversation with different participants
    const otherConv = {
      participant1: 'user-3',
      participant2: 'user-4',
      contextId: null,
      type: 'marketplace',
    };
    mockSelect.mockReturnValue(makeChain('where', [otherConv]));
    const { req, context } = makeRequest();
    const res = await GET(req as never, context as never);
    expect(res.status).toBe(403);
  });

  it('returns 200 with messages when user is a participant', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // conversation lookup
        return makeChain('where', [MOCK_CONV_ROW]);
      }
      // messages fetch
      return makeChain('limit', [MOCK_MESSAGE]);
    });
    mockSet.mockReturnValue({ where: mockUpdateWhere });
    mockUpdateWhere.mockResolvedValue([]);

    const { req, context } = makeRequest();
    const res = await GET(req as never, context as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.messages)).toBe(true);
    expect(body.data.conversation.id).toBe('conv-1');
  });
});
