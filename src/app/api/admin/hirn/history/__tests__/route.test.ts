/**
 * @vitest-environment node
 *
 * Tests for GET/DELETE /api/admin/hirn/history
 *
 * Behaviors locked:
 *   GET /api/admin/hirn/history
 *   - returns 401 when not authenticated
 *   - returns 200 with session list when no sessionId
 *   - returns 200 with history when sessionId provided
 *   - returns 500 when service throws
 *
 *   DELETE /api/admin/hirn/history
 *   - returns 401 when not authenticated
 *   - returns 400 when sessionId is missing
 *   - returns 200 on success
 *   - returns 500 when service throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/api/middleware', async () => ({
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler;
    return (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        return (handler as (r: Request, s: unknown) => unknown)(req, session);
      });
  },
}));

const mockGetChatHistory = vi.fn();
const mockGetUserSessions = vi.fn();
const mockDeleteSession = vi.fn();

vi.mock('@/lib/hirn', () => ({
  getChatHistory: (...args: unknown[]) => mockGetChatHistory(...args),
  getUserSessions: (...args: unknown[]) => mockGetUserSessions(...args),
  deleteSession: (...args: unknown[]) => mockDeleteSession(...args),
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  };
});

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { GET, DELETE } from '../route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: {
    id: 'admin-1',
    email: 'admin@revamp-it.ch',
    name: 'Admin',
    isStaff: true,
    staffPermissions: ['*'] as string[],
    isSuperAdmin: true,
  },
  expires: '2027-01-01',
};

function makeRequest(method = 'GET', params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/hirn/history');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString(), { method });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockGetChatHistory.mockResolvedValue([{ role: 'user', content: 'Hallo' }]);
  mockGetUserSessions.mockResolvedValue([{ id: 'sess-1', createdAt: '2026-05-01' }]);
  mockDeleteSession.mockResolvedValue(undefined);
});

// ============================================================================
// GET /api/admin/hirn/history
// ============================================================================

describe('GET /api/admin/hirn/history — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/hirn/history — authenticated', () => {
  it('returns 200 with session list when no sessionId', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(1);
  });

  it('returns 200 with history when sessionId provided', async () => {
    const response = await GET(makeRequest('GET', { sessionId: 'sess-1' }));
    expect(response.status).toBe(200);
    expect(mockGetChatHistory).toHaveBeenCalledWith('sess-1', 'admin-1');
  });

  it('returns 500 when service throws', async () => {
    mockGetUserSessions.mockRejectedValueOnce(new Error('DB error'));
    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
  });
});

// ============================================================================
// DELETE /api/admin/hirn/history
// ============================================================================

describe('DELETE /api/admin/hirn/history — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await DELETE(makeRequest('DELETE'));
    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/admin/hirn/history — validation', () => {
  it('returns 400 when sessionId is missing', async () => {
    const response = await DELETE(makeRequest('DELETE'));
    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/admin/hirn/history — success', () => {
  it('returns 200 on success', async () => {
    const response = await DELETE(makeRequest('DELETE', { sessionId: 'sess-1' }));
    expect(response.status).toBe(200);
  });

  it('returns 500 when service throws', async () => {
    mockDeleteSession.mockRejectedValueOnce(new Error('DB error'));
    const response = await DELETE(makeRequest('DELETE', { sessionId: 'sess-1' }));
    expect(response.status).toBe(500);
  });
});
