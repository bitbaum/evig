/**
 * @vitest-environment node
 *
 * Tests for PUT/DELETE /api/admin/workshops/materials/[id]
 *
 * Behaviors locked:
 *   PUT - 401, 404, 400 (invalid type), 200
 *   DELETE - 401, 404, 200
 */

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
const mockWhere = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdateReturning = vi.fn();
const mockDelete = vi.fn();
const mockDeleteWhere = vi.fn();
const mockDeleteReturning = vi.fn();

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
    delete: (...args: unknown[]) => {
      mockDelete(...args);
      return { where: mockDeleteWhere };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  workshopMaterials: {
    id: 'wm_id',
    workshopId: 'wm_workshopId',
    instanceId: 'wm_instanceId',
    title: 'wm_title',
    description: 'wm_desc',
    materialType: 'wm_type',
    url: 'wm_url',
    accessType: 'wm_accessType',
    displayOrder: 'wm_displayOrder',
    isActive: 'wm_isActive',
    updatedAt: 'wm_updatedAt',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}));

vi.mock('@/config/workshop-registration-status', () => ({
  WORKSHOP_MATERIAL_ACCESS_TYPE: {
    PUBLIC: 'public',
    REGISTERED: 'registered',
    ATTENDED: 'attended',
  },
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { NextRequest, NextResponse } from 'next/server';
import { PUT, DELETE } from '../route';

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

function makeRequest(method = 'PUT', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/workshops/materials/mat-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

function makeContext(id = 'mat-1') {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  mockFrom.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue([{ id: 'mat-1' }]); // existence check

  mockSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning });
  mockUpdateReturning.mockResolvedValue([{ id: 'mat-1', title: 'Updated' }]);

  mockDeleteWhere.mockReturnValue({ returning: mockDeleteReturning });
  mockDeleteReturning.mockResolvedValue([{ id: 'mat-1' }]);
});

describe('PUT /api/admin/workshops/materials/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await PUT(makeRequest('PUT', { title: 'Updated' }), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('PUT /api/admin/workshops/materials/[id] — validation', () => {
  it('returns 404 when material not found', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const response = await PUT(makeRequest('PUT', { title: 'Updated' }), makeContext());
    expect(response.status).toBe(404);
  });

  it('returns 400 when materialType is invalid', async () => {
    const response = await PUT(makeRequest('PUT', { materialType: 'invalid' }), makeContext());
    expect(response.status).toBe(400);
  });

  it('returns 400 when no fields to update', async () => {
    const response = await PUT(makeRequest('PUT', {}), makeContext());
    expect(response.status).toBe(400);
  });
});

describe('PUT /api/admin/workshops/materials/[id] — success', () => {
  it('returns 200 on success', async () => {
    const response = await PUT(makeRequest('PUT', { title: 'Updated Material' }), makeContext());
    expect(response.status).toBe(200);
  });
});

describe('DELETE /api/admin/workshops/materials/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/admin/workshops/materials/[id] — authenticated', () => {
  it('returns 404 when material not found', async () => {
    mockDeleteReturning.mockResolvedValueOnce([]);
    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(404);
  });

  it('returns 200 on success', async () => {
    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(200);
  });
});
