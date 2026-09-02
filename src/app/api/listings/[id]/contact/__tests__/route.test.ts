/**
 * @vitest-environment node
 *
 * Tests for POST /api/listings/[id]/contact
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/api/middleware', async () => ({
  withAuth: (handler: unknown) => (req: Request, context?: { params?: Promise<{ id: string }> }) =>
    mockAuth().then(async (session: unknown) => {
      if (!session || !(session as { user?: { id?: string } }).user?.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const resolvedContext = context?.params ? { params: await context.params } : undefined;
      return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext);
    }),
}));

const mockValidateBody = vi.fn();

vi.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
  ContactSellerSchema: {},
}));

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: {
    contactSeller: vi.fn().mockReturnValue(true),
  },
  getClientIdentifier: vi.fn().mockReturnValue('127.0.0.1'),
}));

const mockSendMessageInConversation = vi.fn();

vi.mock('@/lib/messaging/send-message', () => ({
  sendMessageInConversation: (...args: unknown[]) => mockSendMessageInConversation(...args),
}));

vi.mock('@/lib/email', () => ({
  sendCustomEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/email/templates/marketplace', () => ({
  newMarketplaceMessage: vi.fn().mockReturnValue({}),
}));

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockInnerJoin = vi.fn();
const mockWhere = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return { from: mockFrom };
    },
  },
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { ACTIVE: 'active', REMOVED: 'removed', DRAFT: 'draft', SOLD: 'sold' },
}));

vi.mock('@/config/database', () => ({
  CONVERSATION_TYPES: { MARKETPLACE: 'marketplace' },
}));

vi.mock('@/config/urls', () => ({
  APP_URL: 'https://example.com',
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
}));

vi.mock('@/db/schema', () => ({
  listings: { id: 'l_id', sellerId: 'l_sellerId', title: 'l_title', status: 'l_status' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import type { MockedFunction } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';
import { rateLimiters } from '@/lib/security/rate-limit';
import { sendCustomEmail } from '@/lib/email';
import { newMarketplaceMessage } from '@/lib/email/templates/marketplace';

const mockContactSeller = rateLimiters.contactSeller as MockedFunction<
  typeof rateLimiters.contactSeller
>;
const mockSendCustomEmail = sendCustomEmail as MockedFunction<typeof sendCustomEmail>;
const mockNewMarketplaceMessage = newMarketplaceMessage as MockedFunction<
  typeof newMarketplaceMessage
>;

// ── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_SESSION = {
  user: {
    id: 'buyer-1',
    email: 'buyer@example.com',
    name: 'Buyer',
    isStaff: false,
    staffPermissions: [] as string[],
  },
  expires: '2027-01-01',
};

const MOCK_LISTING = {
  sellerId: 'seller-1',
  title: 'Dell Laptop',
  status: 'active',
  sellerEmail: 'seller@example.com',
  sellerName: 'Seller',
};

const VALID_BODY = { message: 'Ist das Gerät noch verfügbar?' };

function makeRequest(url: string, body: unknown = VALID_BODY) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  } as never);
}

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockContactSeller.mockReturnValue(true);
  mockValidateBody.mockReturnValue({
    success: true,
    data: { message: 'Ist das Gerät noch verfügbar?' },
  });
  mockSendMessageInConversation.mockResolvedValue({ conversationId: 'conv-1', messageId: 'msg-1' });
  // sendCustomEmail is fire-and-forget (.catch chained), must return a Promise
  mockSendCustomEmail.mockResolvedValue(undefined as never);

  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere });
  mockInnerJoin.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue([MOCK_LISTING]);
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/listings/[id]/contact', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(
      makeRequest('http://localhost:3000/api/listings/listing-1/contact'),
      makeContext('listing-1'),
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 400 when rate limit is exceeded', async () => {
    mockContactSeller.mockReturnValue(false);

    const res = await POST(
      makeRequest('http://localhost:3000/api/listings/listing-1/contact'),
      makeContext('listing-1'),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/Zu viele Nachrichten/);
  });

  it('returns 400 when body validation fails', async () => {
    mockValidateBody.mockReturnValue({
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Ungültige Eingabedaten' },
        { status: 400 },
      ),
    });

    const res = await POST(
      makeRequest('http://localhost:3000/api/listings/listing-1/contact', {}),
      makeContext('listing-1'),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 404 when listing does not exist', async () => {
    mockWhere.mockResolvedValue([]);

    const res = await POST(
      makeRequest('http://localhost:3000/api/listings/unknown/contact'),
      makeContext('unknown'),
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns 400 when listing is not active', async () => {
    mockWhere.mockResolvedValue([{ ...MOCK_LISTING, status: 'sold' }]);

    const res = await POST(
      makeRequest('http://localhost:3000/api/listings/listing-1/contact'),
      makeContext('listing-1'),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/nicht mehr verfügbar/);
  });

  it('returns 400 when buyer tries to contact themselves (self-contact)', async () => {
    // Listing's sellerId matches session user id
    mockWhere.mockResolvedValue([{ ...MOCK_LISTING, sellerId: 'buyer-1' }]);

    const res = await POST(
      makeRequest('http://localhost:3000/api/listings/listing-1/contact'),
      makeContext('listing-1'),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/selbst kontaktieren/);
  });

  it('returns 200 with conversation_id and message_id on success', async () => {
    const res = await POST(
      makeRequest('http://localhost:3000/api/listings/listing-1/contact'),
      makeContext('listing-1'),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.conversation_id).toBe('conv-1');
    expect(body.data.message_id).toBe('msg-1');
  });

  it('calls sendMessageInConversation with correct params on success', async () => {
    await POST(
      makeRequest('http://localhost:3000/api/listings/listing-1/contact'),
      makeContext('listing-1'),
    );

    expect(mockSendMessageInConversation).toHaveBeenCalledTimes(1);
    expect(mockSendMessageInConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        senderId: 'buyer-1',
        recipientId: 'seller-1',
        content: 'Ist das Gerät noch verfügbar?',
        contextId: 'listing-1',
      }),
    );
  });

  it('returns 500 when sendMessageInConversation throws', async () => {
    mockSendMessageInConversation.mockRejectedValue(new Error('messaging service down'));

    const res = await POST(
      makeRequest('http://localhost:3000/api/listings/listing-1/contact'),
      makeContext('listing-1'),
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });

  it('email notification conversationUrl deep-links into the specific conversation (not just the inbox)', async () => {
    // Matches the messages-route fix at commit 0b773948: the dashboard
    // page at /dashboard/messages reads `conversation` from searchParams
    // to auto-select the thread. Without ?conversation=<id> the seller
    // lands on the inbox list and has to scroll/search to find the
    // brand-new conversation.
    await POST(
      makeRequest('http://localhost:3000/api/listings/listing-1/contact'),
      makeContext('listing-1'),
    );
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockNewMarketplaceMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationUrl: expect.stringMatching(/\/dashboard\/messages\?conversation=conv-1$/),
      }),
    );
  });
});
