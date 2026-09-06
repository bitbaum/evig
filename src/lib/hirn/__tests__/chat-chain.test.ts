/**
 * getChatResponse — the chain is now WALKED on real failures.
 *
 * What these lock down is exactly what the previous implementation could not
 * do. It picked one provider by asking `isAvailable()` (a `GET /models` probe)
 * and then called it once, so the "fallback" advanced on a signal unrelated to
 * the failure it needed to survive: a 429, a retired model id or an empty
 * completion on the REAL call was terminal, because the first provider had
 * already passed its audition.
 *
 * Every test here therefore drives the failure through `fetch`, never through
 * `isAvailable`. A test that mocked availability would pass against the old
 * code too, and prove nothing about the change.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function makeChain(result: unknown = []) {
  const resolved = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  for (const m of [
    'select',
    'from',
    'where',
    'orderBy',
    'update',
    'set',
    'insert',
    'values',
    'onConflictDoUpdate',
  ]) {
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

import { getChatResponse } from '../providers';
import { resetLLMHealth, getLLMHealth } from '../health';

/** Both cloud providers enabled, groq the default — the shipped configuration. */
function bothCloudProviders() {
  return [
    { provider: 'groq', is_enabled: true, is_default: true, settings: {} },
    { provider: 'openrouter', is_enabled: true, is_default: false, settings: {} },
  ];
}

function completion(content: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

const ASK = { messages: [{ role: 'user' as const, content: 'Wie viele Mitglieder?' }] };

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetLLMHealth();
  process.env.GROQ_API_KEY = 'groq-key';
  process.env.OPENROUTER_API_KEY = 'or-key';
  mockDbSelect.mockImplementation(() => makeChain(bothCloudProviders()));
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

/** Which vendor each POST went to, in order. */
function vendorsCalled() {
  return fetchMock.mock.calls.map(([url]) =>
    String(url).includes('groq') ? 'groq' : 'openrouter',
  );
}

describe('getChatResponse walks the chain on REAL failures', () => {
  it('an empty 200 is a failure, not an answer — the next link serves', async () => {
    // The old code returned `choices?.[0]?.message?.content || ''`, so this
    // empty string reached the user as the assistant's reply. A reasoning
    // model that spends its budget thinking produces exactly this.
    fetchMock
      .mockResolvedValueOnce(completion(''))
      .mockResolvedValueOnce(completion('Wir haben 42 Mitglieder.'));

    const res = await getChatResponse(ASK);

    expect(res.content).toBe('Wir haben 42 Mitglieder.');
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
  });

  it('a DAILY 429 condemns that whole vendor — its other model is not tried', async () => {
    // Groq has two links in the chain (configured id + known-good default).
    // Both draw on the same org-wide daily budget, so trying the second buys a
    // dead round trip and the identical error.
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes('groq')) {
        return new Response(
          JSON.stringify({
            error: { message: 'Rate limit reached for model per day. Limit 100000, used 100000.' },
          }),
          { status: 429 },
        );
      }
      return completion('OpenRouter antwortet.');
    });

    const res = await getChatResponse(ASK);

    expect(res.content).toBe('OpenRouter antwortet.');
    expect(res.provider).toBe('openrouter');
    expect(vendorsCalled().filter((v) => v === 'groq')).toHaveLength(1);
  });

  it('a retired model id falls through to the same vendor’s known-good default', async () => {
    // The configured id is the one most likely to have rotted: typed once into
    // /admin/hirn and never checked again. The vendor itself is fine, so the
    // rescue must stay at that vendor rather than jumping ship.
    mockDbSelect.mockImplementation(() =>
      makeChain([
        {
          provider: 'groq',
          is_enabled: true,
          is_default: true,
          settings: { model: 'llama-3.3-70b-versatile' },
        },
      ]),
    );

    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      const model = JSON.parse(String(init.body)).model;
      if (model === 'llama-3.3-70b-versatile') {
        return new Response(JSON.stringify({ error: { message: 'model not found' } }), {
          status: 404,
        });
      }
      return completion('Das aktuelle Modell antwortet.');
    });

    const res = await getChatResponse(ASK);

    expect(res.content).toBe('Das aktuelle Modell antwortet.');
    expect(res.model).toBe('openai/gpt-oss-120b');
    expect(res.provider).toBe('groq');
  });

  it('never probes GET /models before chatting — the chat is the probe', async () => {
    fetchMock.mockResolvedValue(completion('Antwort.'));

    await getChatResponse(ASK);

    // The old path spent an extra round trip on every single chat to answer a
    // question the chat itself was about to answer properly.
    const probes = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/models'));
    expect(probes).toHaveLength(0);
  });

  it('a key configured in /admin/hirn beats the environment', async () => {
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
    fetchMock.mockResolvedValue(completion('Antwort.'));

    await getChatResponse(ASK);

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).authorization).toBe(
      'Bearer key-from-the-settings-screen',
    );
  });

  it('records health, so /api/health stops saying "unknown" after a real chat', async () => {
    fetchMock.mockResolvedValue(completion('Antwort.'));
    expect(getLLMHealth().status).toBe('unknown');

    await getChatResponse(ASK);

    expect(getLLMHealth().status).toBe('ok');
  });

  it('every vendor failing throws, and names each failure rather than only the last', async () => {
    fetchMock.mockResolvedValue(new Response('upstream exploded', { status: 500 }));

    await expect(getChatResponse(ASK)).rejects.toThrow();
    expect(getLLMHealth().status).not.toBe('ok');
  });

  it('no key anywhere is an actionable error, not a silent empty answer', async () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    await expect(getChatResponse(ASK)).rejects.toThrow(/Kein KI-Anbieter verf/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
