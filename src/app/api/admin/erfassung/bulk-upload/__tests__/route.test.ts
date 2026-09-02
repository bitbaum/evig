/**
 * @vitest-environment node
 *
 * Tests for POST /api/admin/erfassung/bulk-upload
 *
 * Behaviors locked:
 *   POST - 401, 400 (no file), 400 (wrong type), 400 (empty), 400 (too many products), 200
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

const mockParseCSV = vi.fn();
const mockParseExcel = vi.fn();

vi.mock('@/lib/erfassung/file-parser', () => ({
  parseCSV: (...args: unknown[]) => mockParseCSV(...args),
  parseExcel: (...args: unknown[]) => mockParseExcel(...args),
}));

vi.mock('@/config/erfassung', () => ({
  BULK_LIMITS: { maxProducts: 500 },
}));

vi.mock('@/config/limits', () => ({
  FILE_SIZE_LIMITS: { CSV_MAX: 10 * 1024 * 1024 },
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
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

function makeFormDataRequest(file?: File) {
  const formData = new FormData();
  if (file) formData.append('file', file);
  return new NextRequest('http://localhost/api/admin/erfassung/bulk-upload', {
    method: 'POST',
    body: formData,
  });
}

function makeCsvFile(content: string, name = 'products.csv', size?: number) {
  const blob = new Blob([content], { type: 'text/csv' });
  return new File([blob], name, { type: 'text/csv' });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockParseCSV.mockReturnValue({
    products: [{ title: 'Laptop', price: '100' }],
    unmappedColumns: [],
  });
  mockParseExcel.mockResolvedValue({
    products: [{ title: 'Laptop', price: '100' }],
    unmappedColumns: [],
  });
});

describe('POST /api/admin/erfassung/bulk-upload — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeFormDataRequest(makeCsvFile('title,price')));
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/erfassung/bulk-upload — validation', () => {
  it('returns 400 when no file provided', async () => {
    const response = await POST(makeFormDataRequest());
    expect(response.status).toBe(400);
  });

  it('returns 400 for unsupported file type', async () => {
    const file = new File(['data'], 'products.pdf', { type: 'application/pdf' });
    const response = await POST(makeFormDataRequest(file));
    expect(response.status).toBe(400);
  });

  it('returns 400 when CSV has no products', async () => {
    mockParseCSV.mockReturnValueOnce({ products: [], unmappedColumns: [] });
    const response = await POST(makeFormDataRequest(makeCsvFile('title,price\n')));
    expect(response.status).toBe(400);
  });

  it('returns 400 when product count exceeds limit', async () => {
    mockParseCSV.mockReturnValueOnce({
      products: new Array(600).fill({ title: 'Laptop' }),
      unmappedColumns: [],
    });
    const response = await POST(
      makeFormDataRequest(makeCsvFile('title\n' + 'Laptop\n'.repeat(600))),
    );
    expect(response.status).toBe(400);
  });
});

describe('POST /api/admin/erfassung/bulk-upload — success', () => {
  it('returns 200 with parsed CSV products', async () => {
    const response = await POST(makeFormDataRequest(makeCsvFile('title,price\nLaptop,100')));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.products).toHaveLength(1);
  });
});
