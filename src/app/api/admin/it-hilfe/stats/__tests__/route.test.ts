/**
 * @vitest-environment node
 *
 * Tests for GET /api/admin/it-hilfe/stats
 *
 * Behaviors locked:
 *   GET /api/admin/it-hilfe/stats
 *   - returns 401 when not authenticated
 *   - returns 200 with stats breakdown
 *   - returns 500 when DB throws
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

const mockSelect = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return { from: mockFrom };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  itHilfeRequests: { id: 'r_id', status: 'r_status', urgency: 'r_urgency' },
  repairerProfiles: {
    isActive: 'rp_isActive',
    isVerified: 'rp_isVerified',
    status: 'rp_status',
    profileTier: 'rp_profileTier',
  },
}));

vi.mock('drizzle-orm', () => ({
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}));

vi.mock('@/config/database', () => ({
  TABLE_NAMES: {
    IT_HILFE_TECHNICIAN_PROFILES: 'it_hilfe_technician_profiles',
    IT_HILFE_OFFERS: 'it_hilfe_offers',
  },
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}));

vi.mock('@/config/it-hilfe', () => ({
  REQUEST_STATUS: {
    OPEN: 'open',
    MATCHED: 'matched',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },
  URGENCY: { LOW: 'low', NORMAL: 'normal', HIGH: 'high', URGENT: 'urgent' },
}));

vi.mock('@/config/repairer-status', () => ({
  REPAIRER_PROFILE_TIER: { COMMUNITY: 'community' },
  REPAIRER_STATUS: { SUSPENDED: 'suspended' },
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
  };
});

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../route';

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

const MOCK_ROW = {
  total: '10',
  open: '4',
  matched: '1',
  completed: '2',
  cancelled: '1',
  low: '3',
  normal: '4',
  high: '2',
  urgent: '1',
  activeHelpers: '5',
  verifiedHelpers: '3',
  totalOffers: '8',
};

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/it-hilfe/stats', { method: 'GET' });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  // select().from() — no further chain; from resolves directly
  mockFrom.mockResolvedValue([MOCK_ROW]);
});

// ============================================================================
// GET /api/admin/it-hilfe/stats
// ============================================================================

describe('GET /api/admin/it-hilfe/stats — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/it-hilfe/stats — authenticated', () => {
  it('returns 200 with stats breakdown', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.total).toBe(10);
    expect(body.data.byStatus.open).toBe(4);
    expect(body.data.byUrgency.normal).toBe(4);
    expect(body.data.activeHelpers).toBe(5);
    expect(body.data.resolutionRate).toBe(20); // 2/10 * 100
  });

  it('returns 500 when DB throws', async () => {
    mockFrom.mockRejectedValueOnce(new Error('DB error'));
    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
  });
});
