/**
 * @vitest-environment node
 *
 * Tests for GET /api/protocols/templates
 *
 * Mission-relevant: template config drives the protocol creation UI — staff must
 * see all meeting types with correct labels, colors and icons. No DB involved;
 * correctness is config-shape correctness.
 *
 * Behaviors locked:
 *   GET /api/protocols/templates
 *   - returns 401 when not authenticated
 *   - returns 200 with templates array
 *   - each template has type, label, color, icon fields
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/api/middleware', async () => ({
  withAdmin: (handler: (req: Request, session: unknown) => unknown) => (req: Request) =>
    mockAuth().then((session: unknown) => {
      if (!session || !(session as { user?: { id?: string } }).user?.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      return handler(req, session);
    }),
}));

vi.mock('@/config/protocols', () => ({
  MEETING_TYPES: { TEAM: 'team', BOARD: 'board' },
  MEETING_TYPE_LABELS: { team: 'Team Meeting', board: 'Board Meeting' },
  MEETING_TYPE_TEMPLATES: { team: { agenda: [] }, board: { agenda: [] } },
  MEETING_TYPE_COLORS: { team: 'blue', board: 'green' },
  MEETING_TYPE_ICONS: { team: '👥', board: '🏛️' },
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import type { Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSession() {
  return {
    user: {
      id: 'user-1',
      email: 'admin@revamp-it.ch',
      name: 'Admin',
      isStaff: true,
      staffPermissions: ['*'] as string[],
      isSuperAdmin: true,
    },
    expires: '2027-01-01',
  };
}

function makeGetRequest() {
  return new NextRequest('http://localhost/api/protocols/templates');
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(makeSession());
});

// ============================================================================
// GET /api/protocols/templates
// ============================================================================

describe('GET /api/protocols/templates — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/protocols/templates — authenticated', () => {
  it('returns 200', async () => {
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);
  });

  it('returns a templates array', async () => {
    const response = await GET(makeGetRequest());
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('returns one entry per MEETING_TYPE', async () => {
    const response = await GET(makeGetRequest());
    const body = await response.json();
    // Mock has TEAM and BOARD → 2 entries
    expect(body.data).toHaveLength(2);
  });

  it('each template has type, label, color, icon fields', async () => {
    const response = await GET(makeGetRequest());
    const body = await response.json();
    for (const tpl of body.data) {
      expect(tpl).toHaveProperty('type');
      expect(tpl).toHaveProperty('label');
      expect(tpl).toHaveProperty('color');
      expect(tpl).toHaveProperty('icon');
    }
  });

  it('maps team type correctly', async () => {
    const response = await GET(makeGetRequest());
    const body = await response.json();
    const team = body.data.find((t: { type: string }) => t.type === 'team');
    expect(team).toBeDefined();
    expect(team.label).toBe('Team Meeting');
    expect(team.color).toBe('blue');
    expect(team.icon).toBe('👥');
  });

  it('maps board type correctly', async () => {
    const response = await GET(makeGetRequest());
    const body = await response.json();
    const board = body.data.find((t: { type: string }) => t.type === 'board');
    expect(board).toBeDefined();
    expect(board.label).toBe('Board Meeting');
    expect(board.color).toBe('green');
    expect(board.icon).toBe('🏛️');
  });
});
