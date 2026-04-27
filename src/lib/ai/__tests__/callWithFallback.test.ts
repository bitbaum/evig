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
 */

// ---------------------------------------------------------------------------
// Mocks — set up before imports
// ---------------------------------------------------------------------------

// Chain factory for selectDistinctOn (returns empty rows → use env vars)
function makeSelectChain(result: unknown = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.from = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.orderBy = jest.fn().mockReturnValue(chain)
  chain.then = (resolved as Promise<unknown>).then.bind(resolved)
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved)
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved)
  return chain
}

jest.mock('@/db', () => ({
  db: {
    selectDistinctOn: jest.fn(() => makeSelectChain([])),
  },
}))

jest.mock('@/db/schema', () => ({
  hirnProviderSettings: { provider: 'hp_p', isEnabled: 'hp_ie', isDefault: 'hp_id', settings: 'hp_s', scope: 'hp_sc', updatedAt: 'hp_ua' },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn().mockReturnValue({}),
  desc: jest.fn().mockReturnValue({}),
}))

jest.mock('@/config/urls', () => ({
  OLLAMA_URL: 'http://ollama.test:11434',
  APP_URL: 'http://localhost:3000',
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { callWithFallback, __resetProviderCache } from '../providers'

// ---------------------------------------------------------------------------
// Fetch helper factories
// ---------------------------------------------------------------------------

function okResponse(text: string) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      choices: [{ message: { content: text } }],
    }),
    text: () => Promise.resolve(''),
  })
}

function errorResponse(status: number) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(`HTTP error ${status}`),
  })
}

function ollamaOkResponse(text: string) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ response: text }),
    text: () => Promise.resolve(''),
  })
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let originalFetch: typeof global.fetch
const opts = {
  systemPrompt: 'Du bist ein Assistent.',
  userPrompt: 'Extrahiere die Daten.',
}

beforeAll(() => {
  originalFetch = global.fetch
})

afterAll(() => {
  global.fetch = originalFetch
})

beforeEach(() => {
  jest.clearAllMocks()
  __resetProviderCache()

  // Set API keys via env vars (DB returns empty → env fallback)
  process.env.GROQ_API_KEY = 'groq-test-key'
  process.env.OPENROUTER_API_KEY = 'or-test-key'
  process.env.OLLAMA_MODEL = 'llama3.2'

  global.fetch = jest.fn()
})

afterEach(() => {
  delete process.env.GROQ_API_KEY
  delete process.env.OPENROUTER_API_KEY
  delete process.env.OLLAMA_MODEL
})

// ============================================================================
// Groq success path
// ============================================================================

describe('callWithFallback — Groq succeeds', () => {
  it('returns Groq result with no failed providers', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(okResponse('Groq-Antwort'))

    const result = await callWithFallback(opts)

    expect(result).not.toBeNull()
    expect(result!.provider).toBe('groq')
    expect(result!.text).toBe('Groq-Antwort')
    expect(result!.model).toContain('groq:')
    expect(result!.failedProviders).toHaveLength(0)
  })

  it('calls fetch exactly once when Groq succeeds', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(okResponse('ok'))

    await callWithFallback(opts)

    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// Groq fails → OpenRouter
// ============================================================================

describe('callWithFallback — Groq 401 → OpenRouter', () => {
  it('falls through to OpenRouter on Groq 401 and records the failure', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(errorResponse(401))        // Groq auth failure
      .mockResolvedValueOnce(okResponse('OR-Antwort'))  // OpenRouter success

    const result = await callWithFallback(opts)

    expect(result).not.toBeNull()
    expect(result!.provider).toBe('openrouter')
    expect(result!.text).toBe('OR-Antwort')
    expect(result!.failedProviders).toHaveLength(1)
    expect(result!.failedProviders[0]).toMatchObject({ provider: 'groq', reason: 'auth' })
  })

  it('falls through to OpenRouter on Groq 429 (rate limit)', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(errorResponse(429))
      .mockResolvedValueOnce(okResponse('OR-Antwort'))

    const result = await callWithFallback(opts)

    expect(result!.failedProviders[0]).toMatchObject({ provider: 'groq', reason: 'rate_limit' })
    expect(result!.provider).toBe('openrouter')
  })

  it('falls through to OpenRouter on Groq timeout', async () => {
    const abortError = new Error('The operation was aborted.')
    abortError.name = 'AbortError'
    ;(global.fetch as jest.Mock)
      .mockRejectedValueOnce(abortError)
      .mockResolvedValueOnce(okResponse('OR-Antwort'))

    const result = await callWithFallback(opts)

    expect(result!.failedProviders[0]).toMatchObject({ provider: 'groq', reason: 'timeout' })
    expect(result!.provider).toBe('openrouter')
  })
})

// ============================================================================
// No API key → no_key reason
// ============================================================================

describe('callWithFallback — missing API keys', () => {
  it('records no_key reason when Groq key absent, falls through', async () => {
    delete process.env.GROQ_API_KEY
    __resetProviderCache()

    ;(global.fetch as jest.Mock).mockResolvedValueOnce(okResponse('OR-Antwort'))

    const result = await callWithFallback(opts)

    expect(result!.failedProviders).toHaveLength(1)
    expect(result!.failedProviders[0]).toMatchObject({ provider: 'groq', reason: 'no_key' })
    expect(result!.provider).toBe('openrouter')
    // fetch called only once (for OpenRouter — Groq skipped without fetch)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// Groq + OpenRouter fail → Ollama
// ============================================================================

describe('callWithFallback — falls through to Ollama', () => {
  it('uses Ollama when both cloud providers fail', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(errorResponse(401))           // Groq
      .mockResolvedValueOnce(errorResponse(429))           // OpenRouter
      .mockResolvedValueOnce(ollamaOkResponse('Ollama!'))  // Ollama

    const result = await callWithFallback(opts)

    expect(result!.provider).toBe('ollama')
    expect(result!.text).toBe('Ollama!')
    expect(result!.failedProviders).toHaveLength(2)
  })
})

// ============================================================================
// All providers fail → null
// ============================================================================

describe('callWithFallback — all fail', () => {
  it('returns null when all providers fail', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(errorResponse(500))  // Groq
      .mockResolvedValueOnce(errorResponse(500))  // OpenRouter
      .mockResolvedValueOnce(errorResponse(500))  // Ollama

    const result = await callWithFallback(opts)

    expect(result).toBeNull()
  })

  it('returns null when all API keys missing', async () => {
    delete process.env.GROQ_API_KEY
    delete process.env.OPENROUTER_API_KEY
    __resetProviderCache()

    // Ollama is enabled but returns an error
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(errorResponse(503))

    const result = await callWithFallback(opts)

    expect(result).toBeNull()
    // Groq and OpenRouter skipped (no keys), Ollama tried once
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})
