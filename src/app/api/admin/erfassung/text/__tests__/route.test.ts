/**
 * @vitest-environment node
 *
 * Tests for POST /api/admin/erfassung/text
 *
 * Mission-relevant: AI text extraction pipeline. Validation gates before
 * calling the extraction service; extraction failure path returns 500.
 *
 * Behaviors locked:
 *   POST /api/admin/erfassung/text
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 500 when extraction fails
 *   - returns 200 with extracted product data
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

const mockExtractProductFromText = vi.fn();

vi.mock('@/lib/erfassung/ai-extraction', () => ({
  extractProductFromText: (...args: unknown[]) => mockExtractProductFromText(...args),
}));

vi.mock('@/lib/schemas', () => ({
  validateBody: vi.fn().mockReturnValue({ success: true, data: { text: 'Dell Latitude i5 8GB' } }),
  ErfassungTextSchema: {},
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

const MOCK_EXTRACTION_RESULT = {
  success: true,
  inputText: 'Dell Latitude i5 8GB',
  data: { hersteller: 'Dell', produktname: 'Latitude', ram: '8GB' },
  metadata: {},
  model: 'gpt-4',
  sourceType: 'text',
  verificationSources: [],
};

function makeRequest(body: Record<string, unknown> = { text: 'Dell Latitude i5 8GB' }) {
  return new NextRequest('http://localhost/api/admin/erfassung/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockExtractProductFromText.mockResolvedValue(MOCK_EXTRACTION_RESULT);

  const schemas = (await import('@/lib/schemas')) as any;
  schemas.validateBody.mockReturnValue({ success: true, data: { text: 'Dell Latitude i5 8GB' } });
});

// ============================================================================
// POST /api/admin/erfassung/text
// ============================================================================

describe('POST /api/admin/erfassung/text — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeRequest());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/erfassung/text — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const schemas = (await import('@/lib/schemas')) as any;
    schemas.validateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Ungültige Eingabedaten' },
        { status: 400 },
      ),
    });
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });
});

describe('POST /api/admin/erfassung/text — service errors', () => {
  it('returns 500 when extraction fails', async () => {
    mockExtractProductFromText.mockResolvedValueOnce({ success: false, error: 'AI error' });
    const response = await POST(makeRequest());
    expect(response.status).toBe(500);
  });
});

describe('POST /api/admin/erfassung/text — success', () => {
  it('returns 200 with extracted product data', async () => {
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.data.hersteller).toBe('Dell');
  });
});
