/**
 * @vitest-environment node
 *
 * Tests for GET/POST /api/admin/blog
 *
 * Mission-relevant: admin blog list and creation. POST guards slug uniqueness
 * before inserting — a duplicate slug would cause a DB constraint violation.
 *
 * Behaviors locked:
 *   GET /api/admin/blog
 *   - returns 401 when not authenticated
 *   - returns 200 with posts array
 *   - returns 500 when DB throws
 *
 *   POST /api/admin/blog
 *   - returns 401 when not authenticated
 *   - returns 400 when title or content missing
 *   - returns 400 when slug already exists
 *   - returns 201 with created post id
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
const mockLeftJoin = vi.fn();
const mockOrderBy = vi.fn();
const mockWhere = vi.fn();
const mockInsert = vi.fn();
const mockInsertValues = vi.fn();
const mockInsertReturning = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return { from: mockFrom };
    },
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return { values: mockInsertValues };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  blogPosts: {
    id: 'bp_id',
    slug: 'bp_slug',
    title: 'bp_title',
    excerpt: 'bp_excerpt',
    content: 'bp_content',
    featuredImage: 'bp_featuredImage',
    categoryId: 'bp_categoryId',
    tags: 'bp_tags',
    isPublished: 'bp_isPublished',
    publishedAt: 'bp_publishedAt',
    createdAt: 'bp_createdAt',
    updatedAt: 'bp_updatedAt',
  },
  blogCategories: { id: 'bc_id', name: 'bc_name' },
}));

vi.mock('drizzle-orm', async () => ({
  ...(await vi.importActual('drizzle-orm')),
  eq: vi.fn().mockReturnValue({ __eq: true }),
  desc: vi.fn().mockReturnValue({ __desc: true }),
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../route';

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

const MOCK_POSTS = [
  { id: 'p-1', slug: 'erster-artikel', title: 'Erster Artikel', is_published: true },
  { id: 'p-2', slug: 'zweiter-artikel', title: 'Zweiter Artikel', is_published: false },
];

function makeGetRequest() {
  return new NextRequest('http://localhost/api/admin/blog');
}

function makePostRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/admin/blog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockFrom.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere });
  mockLeftJoin.mockReturnValue({ orderBy: mockOrderBy });
  mockOrderBy.mockResolvedValue(MOCK_POSTS);
  mockWhere.mockResolvedValue([]);
  mockInsertValues.mockReturnValue({ returning: mockInsertReturning });
  mockInsertReturning.mockResolvedValue([{ id: 'p-new' }]);
});

// ============================================================================
// GET /api/admin/blog
// ============================================================================

describe('GET /api/admin/blog — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/blog — authenticated', () => {
  it('returns 200 with posts', async () => {
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);
  });

  it('returns posts array', async () => {
    const response = await GET(makeGetRequest());
    const body = await response.json();
    expect(body.data).toHaveLength(2);
  });

  it('returns 500 when DB throws', async () => {
    mockOrderBy.mockRejectedValueOnce(new Error('DB error'));
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(500);
  });
});

// ============================================================================
// POST /api/admin/blog
// ============================================================================

describe('POST /api/admin/blog — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makePostRequest({ title: 'Test', content: 'Inhalt' }));
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/blog — validation', () => {
  it('returns 400 when title is missing', async () => {
    const response = await POST(makePostRequest({ content: 'Inhalt' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when content is missing', async () => {
    const response = await POST(makePostRequest({ title: 'Test' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when slug already exists', async () => {
    mockWhere.mockResolvedValueOnce([{ id: 'existing' }]);
    const response = await POST(makePostRequest({ title: 'Test', content: 'Inhalt' }));
    expect(response.status).toBe(400);
  });
});

describe('POST /api/admin/blog — success', () => {
  it('returns 201 with post id', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const response = await POST(
      makePostRequest({ title: 'Neuer Artikel', content: '<p>Inhalt</p>' }),
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.id).toBe('p-new');
  });

  it('returns 500 when DB throws on insert', async () => {
    mockWhere.mockResolvedValueOnce([]);
    mockInsertReturning.mockRejectedValueOnce(new Error('DB error'));
    const response = await POST(
      makePostRequest({ title: 'Neuer Artikel', content: '<p>Inhalt</p>' }),
    );
    expect(response.status).toBe(500);
  });
});
