/**
 * @vitest-environment node
 *
 * Tests for POST /api/admin/erfassung/voice
 *
 * Behaviors locked:
 *   POST - 401, 400 (no audio), 400 (transcription fails), 400 (empty text), 200
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

const mockExtractProductFromText = vi.fn();
const mockFetch = vi.fn();

vi.mock('@/lib/erfassung/ai-extraction', () => ({
  extractProductFromText: (...args: unknown[]) => mockExtractProductFromText(...args),
}));

vi.mock('@/config/services', () => ({
  SERVICE_URLS: { TRANSCRIPTION: 'http://localhost:8000' },
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

const MOCK_EXTRACTION = {
  success: true,
  data: { produktname: 'Laptop', category: 'electronics' },
  metadata: { confidence: 0.9 },
  model: 'llama-3.3',
  sourceType: 'voice',
};

function makeAudioRequest(hasAudio = true) {
  const formData = new FormData();
  if (hasAudio) {
    const audioBlob = new Blob(['audio-data'], { type: 'audio/webm' });
    formData.append('audio', new File([audioBlob], 'recording.webm', { type: 'audio/webm' }));
  }
  return new NextRequest('http://localhost/api/admin/erfassung/voice', {
    method: 'POST',
    body: formData,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  global.fetch = mockFetch;
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      text: 'Dell Latitude E7470 Laptop',
      language: 'de',
      duration_processing: 1.2,
    }),
    text: async () => '',
  });

  mockExtractProductFromText.mockResolvedValue(MOCK_EXTRACTION);
});

describe('POST /api/admin/erfassung/voice — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeAudioRequest());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/erfassung/voice — validation', () => {
  it('returns 400 when no audio file provided', async () => {
    const response = await POST(makeAudioRequest(false));
    expect(response.status).toBe(400);
  });

  it('returns 500 when transcription service fails', async () => {
    // Both providers (Groq primary + local fallback) fail → 500
    mockFetch.mockResolvedValue({
      ok: false,
      text: async () => 'Service unavailable',
    });
    const response = await POST(makeAudioRequest());
    expect(response.status).toBe(500);
  });

  it('returns 400 when transcription returns empty text', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: '   ', language: 'de' }),
    });
    const response = await POST(makeAudioRequest());
    expect(response.status).toBe(400);
  });
});

describe('POST /api/admin/erfassung/voice — success', () => {
  it('returns 200 with extraction data', async () => {
    const response = await POST(makeAudioRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.transcription).toBe('Dell Latitude E7470 Laptop');
    expect(body.data.data.produktname).toBe('Laptop');
  });
});
