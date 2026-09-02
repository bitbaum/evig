/**
 * @vitest-environment node
 *
 * Tests for POST /api/workshops/[slug]/register-with-payment
 *
 * Behaviors locked:
 *   POST - 401, 400 (validation), 404 (workshop not found), 400 (full), 201 (success)
 */

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();
const mockExecute = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return { values: mockValues };
    },
    execute: (...args: unknown[]) => mockExecute(...args),
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/db/schema/workshops', () => ({
  workshops: {
    id: 'w_id',
    title: 'w_title',
    price_cents: 'w_price_cents',
    slug: 'w_slug',
    is_active: 'w_is_active',
  },
  workshopInstances: {
    id: 'wi_id',
    status: 'wi_status',
    currentParticipants: 'wi_currentParticipants',
    maxParticipants: 'wi_maxParticipants',
  },
  workshopRegistrations: {
    id: 'wr_id',
    userId: 'wr_userId',
    workshopInstanceId: 'wr_workshopInstanceId',
    status: 'wr_status',
    paymentStatus: 'wr_paymentStatus',
    paymentAmountCents: 'wr_paymentAmountCents',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  getTableName: () => 'mock_table',
}));

const mockValidateBody = vi.fn();

vi.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
  WorkshopRegisterWithPaymentSchema: {},
}));

const mockProcessPayment = vi.fn();
const mockBuildInvoiceLineItem = vi.fn();
const mockCentsToDisplay = vi.fn();

vi.mock('@/lib/payments/payment-flow', () => ({
  processPayment: (...args: unknown[]) => mockProcessPayment(...args),
  buildInvoiceLineItem: (...args: unknown[]) => mockBuildInvoiceLineItem(...args),
  centsToDisplay: (...args: unknown[]) => mockCentsToDisplay(...args),
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
    apiUnauthorized: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 401 }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/config/workshop-registration-status', () => ({
  WORKSHOP_REGISTRATION_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    ATTENDED: 'attended',
    CANCELLED: 'cancelled',
  },
}));

vi.mock('@/config/workshops', () => ({
  WORKSHOP_INSTANCE_STATUS: {
    SCHEDULED: 'scheduled',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
  },
}));

vi.mock('@/config/payment-status', () => ({
  PAYMENT_STATUS: { PENDING: 'pending', SUCCEEDED: 'succeeded' },
}));

vi.mock('@/config/urls', () => ({ APP_URL: 'https://example.com' }));

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

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

const MOCK_WORKSHOP = {
  id: 'workshop-1',
  title: 'Linux Basics',
  price_cents: 2500,
  slug: 'linux-basics',
  is_active: true,
};

const VALID_BODY = {
  instanceId: null,
  useEscrow: false,
};

function makeRequest(slug = 'linux-basics', body?: unknown) {
  return new NextRequest(`http://localhost/api/workshops/${slug}/register-with-payment`, {
    method: 'POST',
    body: JSON.stringify(body ?? VALID_BODY),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockValidateBody.mockReturnValue({ success: true, data: VALID_BODY });
  mockBuildInvoiceLineItem.mockReturnValue({ description: 'Linux Basics', amount: 2500 });
  mockCentsToDisplay.mockReturnValue('CHF 25.00');
  mockProcessPayment.mockResolvedValue({
    paymentUrl: 'https://pay.example.com/pay/123',
    transactionId: 'tx-1',
    invoiceId: 'inv-1',
    invoiceNumber: 'INV-001',
    totalAmountCents: 2500,
    currency: 'CHF',
  });
  mockReturning.mockResolvedValue([{ id: 'reg-1' }]);
  mockValues.mockReturnValue({ returning: mockReturning });
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
    const txInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'reg-1' }]),
      }),
    });
    const txExecute = vi.fn().mockResolvedValue({ rows: [] });
    return fn({ insert: txInsert, execute: txExecute });
  });
});

describe('POST /api/workshops/[slug]/register-with-payment — unauthenticated', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });
});

describe('POST /api/workshops/[slug]/register-with-payment — validation', () => {
  it('returns 400 when body validation fails', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Validation failed' }, { status: 400 }),
    });
    // workshop lookup
    mockExecute.mockResolvedValue({ rows: [MOCK_WORKSHOP] });

    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
  });

  it('returns 404 when workshop not found', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] });

    const res = await POST(makeRequest());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Workshop nicht gefunden');
  });

  it('returns 400 when workshop has no price', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [{ ...MOCK_WORKSHOP, price_cents: 0 }] });

    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
  });

  it('returns 400 when workshop instance is full', async () => {
    const bodyWithInstance = { instanceId: 'instance-1', useEscrow: false };
    mockValidateBody.mockReturnValue({ success: true, data: bodyWithInstance });
    // Workshop found
    mockExecute.mockResolvedValueOnce({ rows: [MOCK_WORKSHOP] });
    // Instance found but full
    mockExecute.mockResolvedValueOnce({
      rows: [
        {
          id: 'instance-1',
          title: 'Linux Basics',
          workshop_price: 2500,
          current_participants: 20,
          max_participants: 20,
          status: 'scheduled',
        },
      ],
    });
    // Existing registration check
    mockWhere.mockResolvedValue([]);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    const res = await POST(makeRequest('linux-basics', bodyWithInstance));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/ausgebucht/i);
  });
});

describe('POST /api/workshops/[slug]/register-with-payment — success', () => {
  it('returns 200 with registration and payment URL', async () => {
    // Workshop found
    mockExecute.mockResolvedValueOnce({ rows: [MOCK_WORKSHOP] });
    // Existing registration check — none
    mockWhere.mockResolvedValue([]);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.paymentUrl).toBe('https://pay.example.com/pay/123');
    expect(body.data.registrationId).toBe('reg-1');
    expect(body.data.workshopTitle).toBe('Linux Basics');
  });
});

describe('POST /api/workshops/[slug]/register-with-payment — existing registration', () => {
  it('returns 400 with clear message when prior PENDING registration is in flight (was 500 from UNIQUE conflict)', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [MOCK_WORKSHOP] });
    // Existing PENDING row blocks the new payment flow
    mockWhere.mockResolvedValue([{ id: 'prior-reg', status: 'pending' }]);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/läuft bereits/i);
  });

  it('resurrects a CANCELLED registration via UPDATE instead of 500ing on UNIQUE conflict', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [MOCK_WORKSHOP] });
    mockWhere.mockResolvedValue([{ id: 'prior-reg', status: 'cancelled' }]);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    // Capture which path the transaction took: UPDATE (resurrect) vs INSERT
    const txInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-reg' }]),
      }),
    });
    const txUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'prior-reg' }]),
        }),
      }),
    });
    const txExecute = vi.fn().mockResolvedValue({ rows: [] });
    mockTransaction.mockImplementationOnce(async (fn: (tx: unknown) => unknown) =>
      fn({ insert: txInsert, update: txUpdate, execute: txExecute }),
    );

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    // Existing CANCELLED row resurrected — returned ID matches the prior row
    expect(body.data.registrationId).toBe('prior-reg');
    expect(txUpdate).toHaveBeenCalled();
    expect(txInsert).not.toHaveBeenCalled();
  });

  it('returns 400 ausgebucht when in-transaction capacity re-check fails (race-window guard)', async () => {
    // The pre-transaction capacity check at the top of the route reads
    // current_participants without a lock — between that read and the
    // INSERT inside the transaction, a concurrent registrant could push
    // the count to max. The fix re-verifies under FOR UPDATE inside the
    // transaction and throws CapacityExceededError → the handler maps
    // to 400 ausgebucht.
    const bodyWithInstance = { instanceId: 'instance-1', useEscrow: false };
    mockValidateBody.mockReturnValue({ success: true, data: bodyWithInstance });

    // Workshop found
    mockExecute.mockResolvedValueOnce({ rows: [MOCK_WORKSHOP] });
    // Instance found with capacity at the pre-transaction read (19 < 20)
    mockExecute.mockResolvedValueOnce({
      rows: [
        {
          id: 'instance-1',
          title: 'Linux Basics',
          workshop_price: 2500,
          current_participants: 19,
          max_participants: 20,
          status: 'scheduled',
        },
      ],
    });
    // No existing registration
    mockWhere.mockResolvedValue([]);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    // Inside the transaction the FOR UPDATE re-check sees current=20 (a
    // sibling registrant slipped in between the outer read and the
    // transaction). Capacity exceeded.
    mockTransaction.mockImplementationOnce(async (fn: (tx: unknown) => unknown) => {
      const txInsert = vi.fn();
      const txUpdate = vi.fn();
      const txExecute = vi.fn().mockResolvedValueOnce({
        rows: [{ current_participants: 20, max_participants: 20 }],
      });
      return fn({ insert: txInsert, update: txUpdate, execute: txExecute });
    });

    const res = await POST(makeRequest('linux-basics', bodyWithInstance));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/ausgebucht/i);
  });
});
