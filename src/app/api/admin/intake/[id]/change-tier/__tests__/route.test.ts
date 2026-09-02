/**
 * @vitest-environment node
 *
 * Tests for POST /api/admin/intake/[id]/change-tier
 *
 * Behaviors locked:
 *   POST /api/admin/intake/[id]/change-tier
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 404 when item not found
 *   - returns 400 when item is already published
 *   - returns 400 when new tier is same as current
 *   - returns 200 with old_tier, new_tier, checklist_reset
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
    return (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined;
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(
          req,
          session,
          resolvedContext,
        );
      });
  },
}));

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockInnerJoin = vi.fn();
const mockWhere = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return { from: mockFrom };
    },
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return { set: mockSet };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  inventoryItems: {
    id: 'ii_id',
    aiProductId: 'ii_aiProductId',
    intakeTier: 'ii_intakeTier',
    intakeChecklist: 'ii_intakeChecklist',
    checklistComplete: 'ii_checklistComplete',
    marketplaceStatus: 'ii_mktStatus',
    updatedAt: 'ii_updatedAt',
  },
  aiExtractedProducts: { id: 'aep_id', category: 'aep_category' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  isNotNull: (col: unknown) => ({ __isNotNull: col }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}));

// z is used at module init to create TierChangeSchema — allow real zod to run
vi.mock('@/config/intake-status', () => ({
  INTAKE_STATUS: { PUBLISHED: 'published', IN_PROGRESS: 'in_progress', READY: 'ready' },
}));

vi.mock('@/config/intake-checklist', () => ({
  INTAKE_TIERS: { REFURBISH: 'refurbish', PARTS: 'parts', RECYCLE: 'recycle' },
  getChecklistForDevice: vi.fn().mockReturnValue([{ id: 'photos', label: 'Fotos' }]),
  emptyChecklistItemState: vi.fn((..._args: unknown[]) => ({
    result: null,
    completedBy: null,
    completedAt: null,
    notes: '',
  })),
}));

const mockValidateBody = vi.fn();

vi.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Interner Serverfehler',
    INTAKE_ITEM_NOT_FOUND: 'Nicht gefunden',
  },
}));

const mockAppendIntakeEvent = vi.fn();

vi.mock('@/lib/intake/timeline', () => ({
  appendIntakeEvent: (...args: unknown[]) => mockAppendIntakeEvent(...args),
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
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

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

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
  id: 'inv-1',
  intakeTier: 'refurbish',
  marketplaceStatus: 'draft',
  category: 'Laptop',
};

function makeRequest(
  body: Record<string, unknown> = { new_tier: 'parts', reason: 'Screen broken' },
) {
  return new NextRequest('http://localhost/api/admin/intake/inv-1/change-tier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeContext(id = 'inv-1') {
  return { params: Promise.resolve({ id }) };
}

beforeEach(async () => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin });
  mockInnerJoin.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue([MOCK_ROW]);

  mockSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdateWhere.mockResolvedValue(undefined);

  mockAppendIntakeEvent.mockResolvedValue(undefined);

  mockValidateBody.mockReturnValue({
    success: true,
    data: { new_tier: 'parts', reason: 'Screen broken' },
  });

  const checklist = (await import('@/config/intake-checklist')) as any;
  checklist.getChecklistForDevice.mockReturnValue([{ id: 'photos', label: 'Fotos' }]);
});

// ============================================================================
// POST /api/admin/intake/[id]/change-tier
// ============================================================================

describe('POST /api/admin/intake/[id]/change-tier — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/intake/[id]/change-tier — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Ungültige Eingabedaten' },
        { status: 400 },
      ),
    });
    const response = await POST(makeRequest({}), makeContext());
    expect(response.status).toBe(400);
  });

  it('returns 404 when item not found', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(404);
  });

  it('returns 400 when item is already published', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_ROW, marketplaceStatus: 'published' }]);
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(400);
  });

  it('returns 400 when new tier is same as current', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { new_tier: 'refurbish', reason: 'Same tier' },
    });
    const response = await POST(
      makeRequest({ new_tier: 'refurbish', reason: 'Same tier' }),
      makeContext(),
    );
    expect(response.status).toBe(400);
  });
});

describe('POST /api/admin/intake/[id]/change-tier — success', () => {
  it('returns 200 with old_tier, new_tier, checklist_reset', async () => {
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.old_tier).toBe('refurbish');
    expect(body.data.new_tier).toBe('parts');
    expect(body.data.checklist_reset).toBe(true);
  });
});
