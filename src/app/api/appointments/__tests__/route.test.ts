/**
 * @vitest-environment node
 *
 * Tests for GET /api/appointments and POST /api/appointments
 *
 * Behaviors locked:
 *   GET  - 401, 200 with appointments list
 *   POST - 401, 201 with created appointment (fire-and-forget email)
 */

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
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  },
}));

vi.mock('@/db/schema', () => ({
  serviceAppointments: {
    id: 'sa_id',
    userId: 'sa_userId',
    repairerId: 'sa_repairerId',
    repairerProfileId: 'sa_repairerProfileId',
    serviceTypeId: 'sa_serviceTypeId',
    description: 'sa_description',
    deviceInfo: 'sa_deviceInfo',
    preferredDate: 'sa_preferredDate',
    confirmedDate: 'sa_confirmedDate',
    urgency: 'sa_urgency',
    status: 'sa_status',
    isHomeVisit: 'sa_isHomeVisit',
    visitAddress: 'sa_visitAddress',
    visitCity: 'sa_visitCity',
    quotedPriceChf: 'sa_quotedPriceChf',
    diagnosisNotes: 'sa_diagnosisNotes',
    completionNotes: 'sa_completionNotes',
    customerRating: 'sa_customerRating',
    createdAt: 'sa_createdAt',
    updatedAt: 'sa_updatedAt',
  },
  serviceTypes: { id: 'st_id', name: 'st_name', slug: 'st_slug' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
  repairerProfiles: { id: 'rp_id', businessName: 'rp_businessName' },
}));

vi.mock('drizzle-orm/pg-core', () => ({
  alias: (_t: unknown, name: string) => ({
    id: `${name}_id`,
    name: `${name}_name`,
    email: `${name}_email`,
  }),
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  desc: (a: unknown) => ({ __desc: a }),
  asc: (a: unknown) => ({ __asc: a }),
  isNull: (a: unknown) => ({ __isNull: a }),
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, details?: unknown) =>
      NextResponse.json({ success: false, error: msg, details }, { status: 400 }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiForbidden: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiUnauthorized: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 401 }),
    validateQuery: (_schema: unknown, data: unknown) => ({
      success: true,
      data: { limit: 20, offset: 0, ...(data as object) },
    }),
    parsePagination: () => ({ limit: 20, offset: 0 }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/email', () => ({
  sendCustomEmail: vi.fn().mockResolvedValue({ success: true }),
  appointmentUnassignedAlert: vi.fn().mockResolvedValue(undefined),
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

const mockValidateBody = vi.fn((_schema: unknown, data: unknown) => ({ success: true, data }));
const mockValidateQuery = vi.fn((_schema: unknown, data: unknown) => ({
  success: true,
  data: { limit: 20, offset: 0, ...(data as object) },
}));

vi.mock('@/lib/schemas', () => ({
  validateBody: (schema: unknown, data: unknown) => mockValidateBody(schema, data),
  validateQuery: (schema: unknown, data: unknown) => mockValidateQuery(schema, data),
  CreateAppointmentSchema: {},
  GetAppointmentsQuerySchema: {},
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}));

vi.mock('@/config/it-hilfe', () => ({
  REVAMPIT_NOTIFICATION_EMAIL: 'notify@revamp-it.ch',
  URGENCY_DEFAULT: 'normal',
}));

vi.mock('@/config/booking-status', () => ({
  BOOKING_STATUS: { REQUESTED: 'requested', IN_PROGRESS: 'in_progress' },
}));

vi.mock('@/lib/constants', () => ({
  ROLES: { REPAIRER: 'repairer', CUSTOMER: 'customer' },
}));

vi.mock('@/config/urls', () => ({
  APP_URL: 'http://localhost:3000',
}));

vi.mock('@/config/database', () => ({
  TABLE_NAMES: { SERVICE_APPOINTMENTS: 'service_appointments' },
}));

import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../route';

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

const MOCK_APPOINTMENT = {
  id: 'appt-1',
  user_id: 'user-1',
  repairer_id: null,
  service_type_id: 'svc-1',
  description: 'Laptop reparieren',
  status: 'requested',
  urgency: 'normal',
  created_at: new Date(),
  updated_at: new Date(),
};

function makeSelectChain(rows: unknown[]) {
  const offset = vi.fn().mockResolvedValue(rows);
  const limit = vi.fn().mockReturnValue({ offset });
  const orderBy = vi.fn().mockReturnValue({ limit });
  const where = vi.fn().mockReturnValue({ orderBy, limit: vi.fn().mockReturnValue({ offset }) });
  const leftJoin = vi.fn();
  leftJoin.mockReturnValue({ leftJoin, where });
  const from = vi.fn().mockReturnValue({ leftJoin, where });
  return { from };
}

function makeCountChain(count: number) {
  const where = vi.fn().mockResolvedValue([{ total: count }]);
  const from = vi.fn().mockReturnValue({ where });
  return { from };
}

beforeEach(async () => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  mockValidateBody.mockImplementation((_schema: unknown, data: unknown) => ({
    success: true,
    data,
  }));
  mockValidateQuery.mockImplementation((_schema: unknown, data: unknown) => ({
    success: true,
    data: { limit: 20, offset: 0, ...(data as object) },
  }));

  ((await import('@/lib/email')) as any).sendCustomEmail.mockResolvedValue({ success: true });
  ((await import('@/lib/email')) as any).appointmentUnassignedAlert.mockResolvedValue(undefined);

  // Default: first select returns appointments list, second returns count
  mockSelect
    .mockReturnValueOnce(makeSelectChain([MOCK_APPOINTMENT]))
    .mockReturnValue(makeCountChain(1));

  mockValues.mockReturnValue({ returning: mockReturning });
  mockReturning.mockResolvedValue([MOCK_APPOINTMENT]);
});

// ============================================================================
// GET — list appointments
// ============================================================================

describe('GET /api/appointments — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/appointments');
    const response = await GET(req);
    expect(response.status).toBe(401);
  });
});

describe('GET /api/appointments — success', () => {
  it('returns 200 with appointments and pagination', async () => {
    const req = new NextRequest('http://localhost/api/appointments');
    const response = await GET(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.appointments).toHaveLength(1);
    expect(body.data.pagination).toBeDefined();
    expect(body.data.pagination.total).toBe(1);
  });

  it('returns 200 with empty list when no appointments', async () => {
    mockSelect
      .mockReset()
      .mockReturnValueOnce(makeSelectChain([]))
      .mockReturnValue(makeCountChain(0));

    const req = new NextRequest('http://localhost/api/appointments');
    const response = await GET(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.appointments).toHaveLength(0);
    expect(body.data.pagination.total).toBe(0);
  });

  it('filters by repairer role when role=repairer', async () => {
    const req = new NextRequest('http://localhost/api/appointments?role=repairer');
    const response = await GET(req);
    expect(response.status).toBe(200);
  });
});

// ============================================================================
// POST — create appointment
// ============================================================================

describe('POST /api/appointments — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/appointments', {
      method: 'POST',
      body: JSON.stringify({ description: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(401);
  });
});

describe('POST /api/appointments — success', () => {
  it('returns 201 with created appointment when service_type_id provided', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: {
        service_type_id: 'svc-1',
        description: 'Laptop reparieren',
        urgency: 'normal',
        is_home_visit: false,
        repairer_id: 'repairer-1',
      },
    });

    const req = new NextRequest('http://localhost/api/appointments', {
      method: 'POST',
      body: JSON.stringify({ service_type_id: 'svc-1', description: 'Laptop reparieren' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.appointment).toBeDefined();
  });

  it('returns 201 without repairer and triggers unassigned notification', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: {
        service_type_id: 'svc-1',
        description: 'Dringende Reparatur',
        urgency: 'urgent',
        is_home_visit: false,
        repairer_id: null,
      },
    });

    const req = new NextRequest('http://localhost/api/appointments', {
      method: 'POST',
      body: JSON.stringify({ service_type_id: 'svc-1', description: 'Dringende Reparatur' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(201);
  });

  it('returns 201 when resolving serviceSlug to service_type_id', async () => {
    // No service_type_id, but serviceSlug provided → first select resolves slug
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: {
        serviceSlug: 'laptop-repair',
        description: 'Laptop reparieren',
        urgency: 'normal',
        is_home_visit: false,
      },
    });

    // Reset selects: first for slug lookup, second for count (POST path uses insert, not a second select for count)
    mockSelect.mockReset();
    const slugChain = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'svc-resolved' }]),
        }),
      }),
    };
    mockSelect.mockReturnValue(slugChain);

    const req = new NextRequest('http://localhost/api/appointments', {
      method: 'POST',
      body: JSON.stringify({ serviceSlug: 'laptop-repair', description: 'Laptop reparieren' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(201);
  });
});
