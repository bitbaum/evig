/**
 * Tests for callWithFallback in lib/ai/providers.ts.
 *
 * Mission-relevant: callWithFallback is the backbone of every AI extraction
 * call (inventory, blog, protocols). If the cascade skips a working provider
 * or swallows a useful error, staff gets no AI assistance without knowing why.
 *
 * Behaviors locked:
 *   callWithFallback
 *   - returns Groq result on first success (no fallback needed)
 *   - skips Groq on 401 and falls through to OpenRouter
 *   - skips Groq on 429 (rate-limit) and falls through
 *   - skips Groq on timeout (AbortError) and falls through
 *   - collects failed providers in result.failedProviders
 *   - skips provider when API key is absent (no_key reason)
 *   - falls through to Ollama when Groq + OpenRouter both fail
 *   - returns null when all providers fail
 *
 *   ai-kit chain integration (the point of this migration — see providers.ts
 *   header comment): the model id sent to each vendor comes from ai-kit's
 *   `freeChain`, not a local hardcoded constant, so a retirement is fixed by
 *   updating ai-kit once for the whole fleet rather than repinning this file.
 *   - requests ai-kit's default free model id for Groq
 *   - requests ai-kit's default free model id for OpenRouter (on fallback)
 *   - honors an EVIG_GROQ_MODELS env override without a code change
 */

// ---------------------------------------------------------------------------
// Mocks — set up before imports
// ---------------------------------------------------------------------------

// Chain factory for selectDistinctOn (returns empty rows → use env vars)
function makeSelectChain(result: unknown = []) {
  const resolved = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.then = (resolved as Promise<unknown>).then.bind(resolved);
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved);
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved);
  return chain;
}

vi.mock('@/db', () => ({
  db: {
    selectDistinctOn: vi.fn((..._args: unknown[]) => makeSelectChain([])),
  },
}));

vi.mock('@/db/schema', () => ({
  hirnProviderSettings: {
    provider: 'hp_p',
    isEnabled: 'hp_ie',
    isDefault: 'hp_id',
    settings: 'hp_s',
    scope: 'hp_sc',
    updatedAt: 'hp_ua',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn().mockReturnValue({}),
  desc: vi.fn().mockReturnValue({}),
}));

vi.mock('@/config/urls', () => ({
  OLLAMA_URL: 'http://ollama.test:11434',
  APP_URL: 'http://localhost:3000',
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import type { Mock } from 'vitest';
import { callWithFallback, __resetProviderCache } from '../providers';

// ---------------------------------------------------------------------------
// Fetch helper factories
// ---------------------------------------------------------------------------

function okResponse(text: string) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        choices: [{ message: { content: text } }],
      }),
    text: () => Promise.resolve(''),
  });
}

function errorResponse(status: number) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(`HTTP error ${status}`),
  });
}

function ollamaOkResponse(text: string) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ response: text }),
    text: () => Promise.resolve(''),
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let originalFetch: typeof global.fetch;
const opts = {
  systemPrompt: 'Du bist ein Assistent.',
  userPrompt: 'Extrahiere die Daten.',
};

beforeAll(() => {
  originalFetch = global.fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

beforeEach(() => {
  vi.clearAllMocks();
  __resetProviderCache();

  // Set API keys via env vars (DB returns empty → env fallback)
  process.env.GROQ_API_KEY = 'groq-test-key';
  process.env.OPENROUTER_API_KEY = 'or-test-key';
  process.env.OLLAMA_MODEL = 'llama3.2';

  global.fetch = vi.fn();
});

afterEach(() => {
  delete process.env.GROQ_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OLLAMA_MODEL;
});

// ============================================================================
// Groq success path
// ============================================================================

describe('callWithFallback — Groq succeeds', () => {
  it('returns Groq result with no failed providers', async () => {
    (global.fetch as Mock).mockResolvedValueOnce(okResponse('Groq-Antwort'));

    const result = await callWithFallback(opts);

    expect(result).not.toBeNull();
    expect(result!.provider).toBe('groq');
    expect(result!.text).toBe('Groq-Antwort');
    expect(result!.model).toContain('groq:');
    expect(result!.failedProviders).toHaveLength(0);
  });

  it('calls fetch exactly once when Groq succeeds', async () => {
    (global.fetch as Mock).mockResolvedValueOnce(okResponse('ok'));

    await callWithFallback(opts);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Groq fails → OpenRouter
// ============================================================================

describe('callWithFallback — Groq 401 → OpenRouter', () => {
  it('falls through to OpenRouter on Groq 401 and records the failure', async () => {
    (global.fetch as Mock)
      .mockResolvedValueOnce(errorResponse(401)) // Groq auth failure
      .mockResolvedValueOnce(okResponse('OR-Antwort')); // OpenRouter success

    const result = await callWithFallback(opts);

    expect(result).not.toBeNull();
    expect(result!.provider).toBe('openrouter');
    expect(result!.text).toBe('OR-Antwort');
    expect(result!.failedProviders).toHaveLength(1);
    expect(result!.failedProviders[0]).toMatchObject({ provider: 'groq', reason: 'auth' });
  });

  it('falls through to OpenRouter on Groq 429 (rate limit)', async () => {
    (global.fetch as Mock)
      .mockResolvedValueOnce(errorResponse(429))
      .mockResolvedValueOnce(okResponse('OR-Antwort'));

    const result = await callWithFallback(opts);

    expect(result!.failedProviders[0]).toMatchObject({ provider: 'groq', reason: 'rate_limit' });
    expect(result!.provider).toBe('openrouter');
  });

  it('falls through to OpenRouter on Groq timeout', async () => {
    const abortError = new Error('The operation was aborted.');
    abortError.name = 'AbortError';
    (global.fetch as Mock)
      .mockRejectedValueOnce(abortError)
      .mockResolvedValueOnce(okResponse('OR-Antwort'));

    const result = await callWithFallback(opts);

    expect(result!.failedProviders[0]).toMatchObject({ provider: 'groq', reason: 'timeout' });
    expect(result!.provider).toBe('openrouter');
  });
});

// ============================================================================
// No API key → no_key reason
// ============================================================================

describe('callWithFallback — missing API keys', () => {
  it('records no_key reason when Groq key absent, falls through', async () => {
    delete process.env.GROQ_API_KEY;
    __resetProviderCache();

    (global.fetch as Mock).mockResolvedValueOnce(okResponse('OR-Antwort'));

    const result = await callWithFallback(opts);

    expect(result!.failedProviders).toHaveLength(1);
    expect(result!.failedProviders[0]).toMatchObject({ provider: 'groq', reason: 'no_key' });
    expect(result!.provider).toBe('openrouter');
    // fetch called only once (for OpenRouter — Groq skipped without fetch)
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Groq + OpenRouter fail → Ollama
// ============================================================================

describe('callWithFallback — falls through to Ollama', () => {
  it('uses Ollama when both cloud providers fail', async () => {
    (global.fetch as Mock)
      .mockResolvedValueOnce(errorResponse(401)) // Groq
      .mockResolvedValueOnce(errorResponse(429)) // OpenRouter
      .mockResolvedValueOnce(ollamaOkResponse('Ollama!')); // Ollama

    const result = await callWithFallback(opts);

    expect(result!.provider).toBe('ollama');
    expect(result!.text).toBe('Ollama!');
    expect(result!.failedProviders).toHaveLength(2);
  });
});

// ============================================================================
// ai-kit chain integration — model id comes from ai-kit, not a local pin
// ============================================================================

describe('callWithFallback — ai-kit chain integration', () => {
  it("requests ai-kit freeChain's default model id for Groq", async () => {
    (global.fetch as Mock).mockResolvedValueOnce(okResponse('Groq-Antwort'));

    await callWithFallback(opts);

    const [, requestInit] = (global.fetch as Mock).mock.calls[0];
    const body = JSON.parse(requestInit.body as string);
    // Kept loose (only the vendor's own DEFAULT is asserted) so this doesn't
    // itself become a second pin — see ai-kit's chain.ts for the full list.
    expect(body.model).toBe('openai/gpt-oss-120b');
  });

  it("requests ai-kit freeChain's default model id for OpenRouter on fallback", async () => {
    (global.fetch as Mock)
      .mockResolvedValueOnce(errorResponse(401)) // Groq
      .mockResolvedValueOnce(okResponse('OR-Antwort'));

    await callWithFallback(opts);

    const [, requestInit] = (global.fetch as Mock).mock.calls[1];
    const body = JSON.parse(requestInit.body as string);
    expect(body.model).toBe('nvidia/nemotron-3-super-120b-a12b:free');
  });

  it('honors an EVIG_GROQ_MODELS override without a code change', async () => {
    process.env.EVIG_GROQ_MODELS = 'some-other-free-model';
    __resetProviderCache();
    try {
      (global.fetch as Mock).mockResolvedValueOnce(okResponse('Groq-Antwort'));

      await callWithFallback(opts);

      const [, requestInit] = (global.fetch as Mock).mock.calls[0];
      const body = JSON.parse(requestInit.body as string);
      expect(body.model).toBe('some-other-free-model');
    } finally {
      delete process.env.EVIG_GROQ_MODELS;
    }
  });
});

// ============================================================================
// All providers fail → null
// ============================================================================

describe('callWithFallback — all fail', () => {
  it('returns null when all providers fail', async () => {
    (global.fetch as Mock)
      .mockResolvedValueOnce(errorResponse(500)) // Groq
      .mockResolvedValueOnce(errorResponse(500)) // OpenRouter
      .mockResolvedValueOnce(errorResponse(500)); // Ollama

    const result = await callWithFallback(opts);

    expect(result).toBeNull();
  });

  it('returns null when all API keys missing', async () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    __resetProviderCache();

    // Ollama is enabled but returns an error
    (global.fetch as Mock).mockResolvedValueOnce(errorResponse(503));

    const result = await callWithFallback(opts);

    expect(result).toBeNull();
    // Groq and OpenRouter skipped (no keys), Ollama tried once
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
