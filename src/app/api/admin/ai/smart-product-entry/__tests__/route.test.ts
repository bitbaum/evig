/**
 * @vitest-environment node
 *
 * Tests for POST /api/admin/ai/smart-product-entry
 *
 * Behaviors locked:
 *   POST - 401, 400 (validateBody), 503 (AI unavailable), 200
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

const mockValidateBody = vi.fn();
const mockCallWithFallback = vi.fn();
const mockRobustJsonExtract = vi.fn();

vi.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
  SmartProductEntrySchema: {},
}));

vi.mock('@/lib/ai/providers', () => ({
  callWithFallback: (...args: unknown[]) => mockCallWithFallback(...args),
}));

vi.mock('@/lib/ai/extract', () => ({
  robustJsonExtract: (...args: unknown[]) => mockRobustJsonExtract(...args),
}));

vi.mock('@/lib/ai/config/prompts', () => ({
  FORM_AI_REGISTRY: {
    'smart-product-entry': {
      system: 'You are a product expert.',
      extract: 'Extract: {text}',
      temperature: 0.3,
      maxTokens: 1024,
    },
  },
  fillPromptTemplate: (_template: string, vars: Record<string, string>) => vars.text,
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

const MOCK_PRODUCT = {
  title: 'Dell Latitude E7470',
  handle: 'dell-latitude-e7470',
  description: 'Business laptop',
  price: '350',
  category: 'laptop',
  sku: 'DELL-E7470',
  specs: [{ key: 'RAM', value: '8GB' }],
  tags: ['laptop', 'dell'],
  condition: 'gut',
};

function makeRequest(body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/ai/smart-product-entry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? { query: 'Dell Latitude E7470', inputType: 'text' }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockValidateBody.mockReturnValue({
    success: true,
    data: { query: 'Dell Latitude E7470', inputType: 'text' },
  });
  mockCallWithFallback.mockResolvedValue({
    text: '{"title":"Dell Latitude E7470"}',
    provider: 'groq',
    model: 'llama-3.3',
  });
  mockRobustJsonExtract.mockReturnValue(MOCK_PRODUCT);
});

describe('POST /api/admin/ai/smart-product-entry — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeRequest());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/ai/smart-product-entry — validation', () => {
  it('returns 400 when body validation fails', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Invalid' }, { status: 400 }),
    });
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it('returns 503 when all AI providers fail', async () => {
    mockCallWithFallback.mockResolvedValueOnce(null);
    const response = await POST(makeRequest());
    expect(response.status).toBe(503);
  });
});

describe('POST /api/admin/ai/smart-product-entry — success', () => {
  it('returns 200 with extracted product data', async () => {
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.product.title).toBe('Dell Latitude E7470');
    expect(body.data.metadata.provider).toBe('groq');
  });
});
