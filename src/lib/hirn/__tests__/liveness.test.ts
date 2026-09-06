/**
 * /api/health/ai — the route that can say "it works".
 *
 * `/api/health` reports what the last real chat did, and straight after a
 * deploy that is nothing at all. It used to call that state `healthy`, which is
 * a green word backed by no evidence: a dead key, a retired model id and a
 * perfect chain all produced it. Only a real call distinguishes them.
 *
 * What is app-specific here, and what these tests hold, is the WIRING — that an
 * ordinary poll is free, that the gate is really connected to AI_PROBE_SECRET,
 * and that the probe reads the chain AND ITS KEYS from the database rather than
 * from an env captured when the process started.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function makeChain(result: unknown = []) {
  const resolved = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'from', 'where', 'orderBy', 'update', 'set', 'insert', 'values']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.then = (resolved as Promise<unknown>).then.bind(resolved);
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved);
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved);
  return chain;
}

const mockDbSelect = vi.fn((..._args: unknown[]) => makeChain([]));

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect(...args),
    update: () => makeChain(),
    insert: () => makeChain(),
  },
}));

vi.mock('@/db/schema', () => ({
  hirnProviderSettings: {
    provider: 'hp_provider',
    isEnabled: 'hp_isEnabled',
    isDefault: 'hp_isDefault',
    settings: 'hp_settings',
    scope: 'hp_scope',
    userId: 'hp_userId',
    updatedAt: 'hp_updatedAt',
  },
}));

vi.mock('drizzle-orm', async () => ({
  eq: vi.fn(() => 'eq'),
  and: vi.fn(() => 'and'),
  desc: vi.fn(() => 'desc'),
  isNull: vi.fn(() => 'isNull'),
  sql: Object.assign(
    vi.fn(() => 'sql'),
    { raw: vi.fn(() => 'raw') },
  ),
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const ORIGINAL_ENV = { ...process.env };

async function loadRoute() {
  vi.resetModules();
  return (await import('@/app/api/health/ai/route')).GET;
}

function completion(content: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => completion('blue'));
  vi.stubGlobal('fetch', fetchMock);
  delete process.env.AI_PROBE_SECRET;
  delete process.env.GROQ_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  mockDbSelect.mockImplementation(() =>
    makeChain([{ provider: 'groq', is_enabled: true, is_default: true, settings: {} }]),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

describe('GET /api/health/ai', () => {
  it('an ordinary poll costs nothing and touches neither vendor nor database', async () => {
    const GET = await loadRoute();

    const res = await GET(new Request('https://evig.test/api/health/ai'));

    expect(res.status).toBe(200);
    expect((await res.json()).probed).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockDbSelect).not.toHaveBeenCalled();
  });

  it('refuses to probe without the secret, and spends nothing while refusing', async () => {
    process.env.AI_PROBE_SECRET = 'right';
    process.env.GROQ_API_KEY = 'k';
    const GET = await loadRoute();

    expect((await GET(new Request('https://evig.test/api/health/ai?probe=1'))).status).toBe(401);
    expect(
      (await GET(new Request('https://evig.test/api/health/ai?probe=1&secret=wrong'))).status,
    ).toBe(401);

    // The point of the gate is the SPEND, not the status code.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('with AI_PROBE_SECRET unset, probing is OFF (501) rather than open', async () => {
    process.env.GROQ_API_KEY = 'k';
    const GET = await loadRoute();

    const res = await GET(new Request('https://evig.test/api/health/ai?probe=1&secret=anything'));

    expect(res.status).toBe(501);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('probes with the secret and reports what the model actually said', async () => {
    process.env.AI_PROBE_SECRET = 'right';
    process.env.GROQ_API_KEY = 'k';
    const GET = await loadRoute();

    const res = await GET(new Request('https://evig.test/api/health/ai?probe=1&secret=right'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.probed).toBe(true);
    expect(body.answer).toBe('blue');
    expect(body.servedBy).toContain('groq/');
  });

  it('uses the key configured in /admin/hirn, not only the environment', async () => {
    // The bug this guards: resolving links from the database while reading
    // credentials from a process.env captured at construction. The probe would
    // report "no key" for a provider that is configured and working.
    process.env.AI_PROBE_SECRET = 'right';
    mockDbSelect.mockImplementation(() =>
      makeChain([
        {
          provider: 'groq',
          is_enabled: true,
          is_default: true,
          settings: { api_key: 'key-from-the-settings-screen' },
        },
      ]),
    );
    const GET = await loadRoute();

    const res = await GET(new Request('https://evig.test/api/health/ai?probe=1&secret=right'));

    expect(res.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).authorization).toBe(
      'Bearer key-from-the-settings-screen',
    );
  });

  it('a dead chain is 503, so an uptime monitor can watch this URL directly', async () => {
    process.env.AI_PROBE_SECRET = 'right';
    process.env.GROQ_API_KEY = 'k';
    fetchMock.mockResolvedValue(new Response('upstream exploded', { status: 500 }));
    const GET = await loadRoute();

    const res = await GET(new Request('https://evig.test/api/health/ai?probe=1&secret=right'));

    expect(res.status).toBe(503);
    expect((await res.json()).ok).toBe(false);
  });

  it('one probe teaches /api/health — both routes stop saying "unknown"', async () => {
    process.env.AI_PROBE_SECRET = 'right';
    process.env.GROQ_API_KEY = 'k';
    vi.resetModules();
    const { GET } = await import('@/app/api/health/ai/route');
    const { getLLMHealth, resetLLMHealth } = await import('@/lib/hirn/health');

    resetLLMHealth();
    expect(getLLMHealth().status).toBe('unknown');

    await GET(new Request('https://evig.test/api/health/ai?probe=1&secret=right'));

    expect(getLLMHealth().status).toBe('ok');
  });
});
