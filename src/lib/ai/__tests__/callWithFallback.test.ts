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

// Real `Response` objects, not look-alikes.
//
// These were `{ ok, status, json, text }` literals, and the success one carried
// `text: () => Promise.resolve('')` — harmless while the client read `json()`
// first, and fatal the moment it read the text (which it must, to keep the
// vendor's body in the error and tell a spent daily budget from a busy minute).
// Every response then looked like a 200 with an unparseable body. A fake that
// diverges from the contract it imitates decides what the client may do next.
//
// Each call builds a NEW one: a Response body can be read only once, so a
// shared instance would make link two fail with "Body has already been read" —
// a fake failure standing in front of the real one, inside the tests that check
// the fallback.
function okResponse(text: string) {
  return Promise.resolve(
    new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

function errorResponse(status: number, body = `HTTP error ${status}`) {
  return Promise.resolve(new Response(body, { status }));
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

  // ── The 429 taxonomy: one status code, three failures, three remedies ──
  //
  // The hand-rolled client read the body (`await response.text()`) and threw it
  // away, reporting every 429 as `rate_limit: 'Rate-Limit erreicht'`. That told
  // a Betreuer to try again in a minute in all three cases, and was right in
  // one. The message a person acts on is the point of classifying them.

  it('a DAILY 429 says the day is spent, not "try again shortly"', async () => {
    (global.fetch as Mock)
      .mockResolvedValueOnce(
        errorResponse(
          429,
          JSON.stringify({
            error: { message: 'Rate limit reached for model per day. Limit 100000, used 100000.' },
          }),
        ),
      )
      .mockResolvedValueOnce(okResponse('OR-Antwort'));

    const result = await callWithFallback(opts);

    expect(result!.failedProviders[0]).toMatchObject({
      provider: 'groq',
      reason: 'rate_limit',
      message: 'Tageskontingent des Anbieters aufgebraucht',
    });
    // Waiting cannot help — the reset is hours away — but the OTHER vendor has
    // its own meter, which is the whole reason the chain crosses vendors.
    expect(result!.provider).toBe('openrouter');
  });

  it('a SIZE 429 asks for a shorter prompt, and does not blame the vendor', async () => {
    (global.fetch as Mock).mockResolvedValueOnce(
      errorResponse(
        429,
        JSON.stringify({
          error: {
            message:
              'Request too large for model with 12000 tokens per minute. Limit 12000, Requested 15000.',
          },
        }),
      ),
    );

    await callWithFallback(opts);

    // Demoting cannot help either: every link below has a SMALLER ceiling, so
    // the walk STOPS rather than burning the chain to reach a worse version of
    // the same error.
    //
    // Asserting a null result would not show this — everything failing produces
    // null too. What distinguishes "stopped" from "tried them all and failed"
    // is that OpenRouter was never asked.
    const urls = (global.fetch as Mock).mock.calls.map(([url]) => String(url));
    expect(urls.filter((u) => u.includes('groq'))).toHaveLength(1);
    expect(urls.filter((u) => u.includes('openrouter'))).toHaveLength(0);
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
