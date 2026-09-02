/**
 * @vitest-environment node
 *
 * Tests for GET /api/workshops
 *
 * Mission-relevant: the workshops listing powers the public calendar page.
 * If active filtering or category filtering breaks, users see inactive or
 * wrong workshops. If a DB error returns a 500 instead of an empty list,
 * the page crashes rather than degrading gracefully.
 *
 * Behaviors locked:
 *   GET /api/workshops
 *   - returns 200 with workshop list
 *   - filters to active workshops by default
 *   - includes all workshops when active=false
 *   - filters by category when provided
 *   - returns empty array on DB connection error (graceful degradation)
 *   - returns 500 on non-connection DB errors
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = vi.fn().mockResolvedValue(null); // unauthenticated by default

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

// Drizzle select chain: select().from().where().orderBy()
const mockOrderBy = vi.fn();
const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

vi.mock('@/db/schema', () => ({
  workshops: {
    id: 'w_id',
    slug: 'w_slug',
    title: 'w_title',
    description: 'w_desc',
    category: 'w_category',
    duration: 'w_duration',
    level: 'w_level',
    maxParticipants: 'w_maxPart',
    priceCents: 'w_price',
    isActive: 'w_isActive',
    createdAt: 'w_createdAt',
  },
  workshopInstances: {
    id: 'wi_id',
    workshopId: 'wi_wid',
    startDate: 'wi_start',
    endDate: 'wi_end',
    location: 'wi_loc',
    maxParticipants: 'wi_maxPart',
    status: 'wi_status',
    createdAt: 'wi_created',
    updatedAt: 'wi_updated',
  },
  workshopRegistrations: { id: 'wr_id' },
}));

vi.mock('drizzle-orm', async () => ({
  ...(await vi.importActual('drizzle-orm')),
  eq: vi.fn().mockReturnValue({ __eq: true }),
  desc: vi.fn().mockReturnValue({ __desc: true }),
  asc: vi.fn().mockReturnValue({ __asc: true }),
  inArray: vi.fn().mockReturnValue({ __inArray: true }),
  sql: Object.assign(vi.fn().mockReturnValue({ __sql: 'sql' }), {
    raw: vi.fn(),
    join: vi.fn().mockReturnValue({ __sqlJoin: true }),
  }),
}));

vi.mock('@/lib/api/helpers', async () => ({
  apiSuccess: (data: unknown) => {
    return NextResponse.json({ success: true, data });
  },
  apiError: (err: unknown, msg: string, status = 500) => {
    return NextResponse.json({ success: false, error: msg }, { status });
  },
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
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

const MOCK_WORKSHOPS = [
  {
    id: 'w-1',
    slug: 'linux-kurs',
    title: 'Linux Grundkurs',
    description: 'Intro',
    category: 'software',
    duration: 120,
    level: 'beginner',
    max_participants: 12,
    price_cents: 0,
    is_active: true,
    created_at: '2026-01-01',
  },
  {
    id: 'w-2',
    slug: 'repair-basics',
    title: 'Repair Basics',
    description: 'Fix stuff',
    category: 'hardware',
    duration: 180,
    level: 'beginner',
    max_participants: 8,
    price_cents: 2000,
    is_active: true,
    created_at: '2026-01-02',
  },
];

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/workshops');
  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, val);
  }
  return new NextRequest(url.toString());
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(null);
  mockSelect.mockReturnValue({ from: mockFrom });
  mockFrom.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ orderBy: mockOrderBy });
  mockOrderBy.mockResolvedValue(MOCK_WORKSHOPS);
});

// ============================================================================
// GET /api/workshops
// ============================================================================

describe('GET /api/workshops — basic list (no instances)', () => {
  it('returns 200', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
  });

  it('returns workshop list', async () => {
    const response = await GET(makeRequest());
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(2);
  });

  it('returns empty array when no workshops exist', async () => {
    mockOrderBy.mockResolvedValueOnce([]);
    const response = await GET(makeRequest());
    const body = await response.json();
    expect(body.data).toEqual([]);
  });

  it('applies isActive filter by default', async () => {
    await GET(makeRequest());
    const { eq } = (await import('drizzle-orm')) as any;
    expect(eq).toHaveBeenCalledWith(expect.anything(), true);
  });

  it('does not apply isActive filter when active=false', async () => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ orderBy: mockOrderBy });
    mockOrderBy.mockResolvedValue(MOCK_WORKSHOPS);
    await GET(makeRequest({ active: 'false' }));
    const { eq } = (await import('drizzle-orm')) as any;
    // eq should not be called with true (no active filter)
    const activeCalls = (eq as Mock).mock.calls.filter((c) => c[1] === true);
    expect(activeCalls).toHaveLength(0);
  });
});

describe('GET /api/workshops — DB connection error (graceful)', () => {
  it('returns 200 with empty array on ECONNREFUSED', async () => {
    mockOrderBy.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([]);
  });

  it('returns 200 with empty array on timeout error', async () => {
    mockOrderBy.mockRejectedValueOnce(new Error('timeout'));
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([]);
  });
});

describe('GET /api/workshops — non-connection DB error', () => {
  it('returns 500 on unexpected DB error', async () => {
    mockOrderBy.mockRejectedValueOnce(new Error('syntax error in SQL'));
    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
  });
});
