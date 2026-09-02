/**
 * @vitest-environment node
 *
 * Tests for GET /api/health/auth
 *
 * Mission-relevant: this health endpoint is checked by monitoring/alerting.
 * If it always returns 200 even when the auth secret is misconfigured or
 * the DB is down, on-call won't be paged during an actual outage.
 *
 * Behaviors locked:
 *   GET /api/health/auth
 *   - returns 200 when all checks pass
 *   - returns 503 when auth secret is missing/short
 *   - returns 503 when DB query throws
 *   - checks.authSecret is 'ok' when secret is valid
 *   - checks.authSecret is 'missing' when secret is absent
 *   - checks.database is 'ok' when DB query succeeds
 *   - checks.database is 'failed' when DB query throws
 *   - status is 'healthy' when all checks pass
 *   - status is 'unhealthy' when any check fails
 *   - response includes a timestamp string
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockExecute = vi.fn().mockResolvedValue([]);

vi.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockExecute(...args),
  },
}));

vi.mock('drizzle-orm', async () => ({
  ...(await vi.importActual('drizzle-orm')),
  sql: Object.assign(vi.fn().mockReturnValue({ __sql: 'SELECT 1' }), { raw: vi.fn() }),
}));

const mockGetAuthSecret = vi.fn().mockReturnValue('a-valid-secret-longer-than-16-chars');

vi.mock('@/lib/auth/config', () => ({
  getAuthSecret: (...args: unknown[]) => mockGetAuthSecret(...args),
}));

vi.mock('@/lib/api/helpers', async () => ({
  apiSuccess: (data: unknown, status: number) => {
    return NextResponse.json({ success: true, data }, { status });
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import { GET } from '../route';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAuthSecret.mockReturnValue('a-valid-secret-that-is-long-enough');
  mockExecute.mockResolvedValue([]);
});

describe('GET /api/health/auth — all healthy', () => {
  it('returns 200 when all checks pass', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it('status is "healthy"', async () => {
    const response = await GET();
    const body = await response.json();
    expect(body.data.status).toBe('healthy');
  });

  it('checks.authSecret is "ok"', async () => {
    const response = await GET();
    const body = await response.json();
    expect(body.data.checks.authSecret).toBe('ok');
  });

  it('checks.database is "ok"', async () => {
    const response = await GET();
    const body = await response.json();
    expect(body.data.checks.database).toBe('ok');
  });

  it('response includes a timestamp string', async () => {
    const response = await GET();
    const body = await response.json();
    expect(typeof body.data.timestamp).toBe('string');
    expect(body.data.timestamp.length).toBeGreaterThan(0);
  });
});

describe('GET /api/health/auth — auth secret issues', () => {
  it('returns 503 when auth secret is empty string', async () => {
    mockGetAuthSecret.mockReturnValueOnce('');
    const response = await GET();
    expect(response.status).toBe(503);
  });

  it('returns 503 when auth secret is too short (<16 chars)', async () => {
    mockGetAuthSecret.mockReturnValueOnce('short');
    const response = await GET();
    expect(response.status).toBe(503);
  });

  it('checks.authSecret is "missing" when secret is absent', async () => {
    mockGetAuthSecret.mockReturnValueOnce('');
    const response = await GET();
    const body = await response.json();
    expect(body.data.checks.authSecret).toBe('missing');
    expect(body.data.status).toBe('unhealthy');
  });

  it('returns 503 when getAuthSecret throws', async () => {
    mockGetAuthSecret.mockImplementationOnce(() => {
      throw new Error('env not set');
    });
    const response = await GET();
    expect(response.status).toBe(503);
  });
});

describe('GET /api/health/auth — database issues', () => {
  it('returns 503 when DB execute throws', async () => {
    mockExecute.mockRejectedValueOnce(new Error('connection refused'));
    const response = await GET();
    expect(response.status).toBe(503);
  });

  it('checks.database is "failed" when DB throws', async () => {
    mockExecute.mockRejectedValueOnce(new Error('timeout'));
    const response = await GET();
    const body = await response.json();
    expect(body.data.checks.database).toBe('failed');
    expect(body.data.status).toBe('unhealthy');
  });
});
