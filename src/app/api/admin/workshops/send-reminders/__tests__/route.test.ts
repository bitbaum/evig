/**
 * @vitest-environment node
 *
 * Tests for POST /api/admin/workshops/send-reminders
 *
 * Behaviors locked:
 *   POST - 401, 400 (validation), 200 (no upcoming), 200 (with upcoming, tracks sent/failed)
 */

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
const mockInnerJoin = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockValidateBody = vi.fn();
const mockSendEmail = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return { from: mockFrom };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  workshopRegistrations: {
    id: 'wr_id',
    workshopInstanceId: 'wr_instanceId',
    userId: 'wr_userId',
    status: 'wr_status',
  },
  workshopInstances: {
    id: 'wi_id',
    workshopId: 'wi_workshopId',
    startDate: 'wi_startDate',
    location: 'wi_location',
    instructor: 'wi_instructor',
    status: 'wi_status',
  },
  workshops: { id: 'w_id', title: 'w_title', slug: 'w_slug' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  gte: (a: unknown, b: unknown) => ({ __gte: [a, b] }),
  lte: (a: unknown, b: unknown) => ({ __lte: [a, b] }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}));

vi.mock('@/config/workshop-registration-status', () => ({
  WORKSHOP_REGISTRATION_STATUS: { CONFIRMED: 'confirmed' },
}));

vi.mock('@/config/workshops', () => ({
  WORKSHOP_INSTANCE_STATUS: { SCHEDULED: 'scheduled' },
}));

vi.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
  AdminSendRemindersSchema: {},
}));

vi.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock('@/lib/date-formats', () => ({
  formatDateWithWeekday: (_date: unknown) => 'Montag, 1. Juni 2026',
}));

vi.mock('@/config/urls', () => ({
  APP_URL: 'https://revamp-it.ch',
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

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

const MOCK_UPCOMING = [
  {
    instance_id: 'inst-1',
    workshop_title: 'Laptop Repair',
    workshop_slug: 'laptop-repair',
    start_date: new Date('2026-06-01T10:00:00Z'),
    location: 'Zürich',
    instructor: 'Thomas',
    user_id: 'u-1',
    user_name: 'Hans',
    user_email: 'hans@example.com',
    registration_id: 'reg-1',
  },
  {
    instance_id: 'inst-1',
    workshop_title: 'Laptop Repair',
    workshop_slug: 'laptop-repair',
    start_date: new Date('2026-06-01T10:00:00Z'),
    location: null,
    instructor: null,
    user_id: 'u-2',
    user_name: null,
    user_email: 'anna@example.com',
    registration_id: 'reg-2',
  },
];

function makeRequest(body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/workshops/send-reminders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? { daysBeforeWorkshop: 3 }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  mockValidateBody.mockReturnValue({ success: true, data: { daysBeforeWorkshop: 3 } });

  // 4-join query chain: from → innerJoin × 3 → where → orderBy (terminal)
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin });
  mockInnerJoin.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere });
  mockWhere.mockReturnValue({ orderBy: mockOrderBy });
  mockOrderBy.mockResolvedValue([]);

  mockSendEmail.mockResolvedValue({ success: true });
});

describe('POST /api/admin/workshops/send-reminders — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeRequest());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/workshops/send-reminders — validation', () => {
  it('returns 400 when body validation fails', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Invalid' }, { status: 400 }),
    });
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });
});

describe('POST /api/admin/workshops/send-reminders — success', () => {
  it('returns 200 with zero sent when no upcoming workshops', async () => {
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.total).toBe(0);
    expect(body.data.sent).toBe(0);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('returns 200 and reports sent/failed counts', async () => {
    mockOrderBy.mockResolvedValueOnce(MOCK_UPCOMING);
    mockSendEmail
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error('SMTP error'));

    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.total).toBe(2);
    expect(body.data.sent).toBe(1);
    expect(body.data.failed).toBe(1);
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
  });

  it('counts resolved {success:false} as failed (was miscounted as sent before this fix)', async () => {
    // sendEmail's realistic failure mode is to RESOLVE with {success:false}
    // (SMTP rejection, Listmonk disabled, API non-2xx) — not throw. The
    // previous try/catch only caught throws, so these silent failures were
    // miscounted as sent. This test locks the .success check in place.
    mockOrderBy.mockResolvedValueOnce(MOCK_UPCOMING);
    mockSendEmail
      .mockResolvedValueOnce({ success: false, error: 'SMTP rejected' })
      .mockResolvedValueOnce({ success: false, error: 'Listmonk disabled' });

    const response = await POST(makeRequest());
    const body = await response.json();
    expect(body.data.total).toBe(2);
    expect(body.data.sent).toBe(0);
    expect(body.data.failed).toBe(2);
  });
});
