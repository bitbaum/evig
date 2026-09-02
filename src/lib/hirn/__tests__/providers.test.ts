/**
 * Tests for hirn/providers/index.ts — AI provider factory and routing.
 *
 * Mission-relevant: if getDefaultChatProvider's fallback chain breaks,
 * the HIRN assistant has no AI backend and all staff queries fail.
 * If getEmbeddingProvider silently returns null, RAG indexing produces
 * corrupt embeddings.
 *
 * Behaviors locked:
 *   createProvider
 *   - returns OllamaProvider for 'ollama'
 *   - returns GroqProvider for 'groq'
 *   - returns OpenRouterProvider for 'openrouter'
 *   - throws for unknown provider name
 *
 *   getDefaultChatProvider
 *   - uses user default when userId given and user provider available
 *   - skips unavailable user default, falls through to system default
 *   - uses first available fallback when system default unavailable
 *   - throws when no providers available
 *   - only queries system settings when no userId given
 *
 *   getEmbeddingProvider
 *   - returns Ollama when available
 *   - falls back to OpenRouter when Ollama unavailable
 *   - throws when neither available
 *
 *   generateEmbeddings
 *   - delegates to provider.embed()
 *
 *   updateProviderSettings / setProviderEnabled / setDefaultProvider / addUserProvider
 *   - each calls db.update/insert the expected number of times
 */

// ---------------------------------------------------------------------------
// Provider class mocks
// Closures capture mock fns by reference (not value) so they resolve at
// call time — avoids TDZ errors that occur when factories reference
// const variables as values during vi.mock hoisting.
// ---------------------------------------------------------------------------

const mockOllamaIsAvailable = vi.fn();
const mockOllamaEmbed = vi.fn();

vi.mock('../providers/ollama', () => ({
  OllamaProvider: function (_config?: unknown) {
    return {
      isAvailable: (...a: unknown[]) => mockOllamaIsAvailable(...a),
      embed: (...a: unknown[]) => mockOllamaEmbed(...a),
      chat: vi.fn(),
    };
  },
}));

const mockGroqIsAvailable = vi.fn();

vi.mock('../providers/groq', () => ({
  GroqProvider: function (_config?: unknown) {
    return {
      isAvailable: (...a: unknown[]) => mockGroqIsAvailable(...a),
      embed: vi.fn(),
      chat: vi.fn(),
    };
  },
}));

const mockOpenRouterIsAvailable = vi.fn();
const mockOpenRouterEmbed = vi.fn();

vi.mock('../providers/openrouter', () => ({
  OpenRouterProvider: function (_config?: unknown) {
    return {
      isAvailable: (...a: unknown[]) => mockOpenRouterIsAvailable(...a),
      embed: (...a: unknown[]) => mockOpenRouterEmbed(...a),
      chat: vi.fn(),
    };
  },
}));

// ---------------------------------------------------------------------------
// Mock factory for DB chainable builder
// ---------------------------------------------------------------------------

function makeChain(result: unknown = []) {
  const resolved = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.values = vi.fn().mockReturnValue(chain);
  chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
  chain.then = (resolved as Promise<unknown>).then.bind(resolved);
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved);
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved);
  return chain;
}

// ---------------------------------------------------------------------------
// DB mocks
// ---------------------------------------------------------------------------

const mockDbSelect = vi.fn((..._args: unknown[]) => makeChain([]));
const mockDbUpdate = vi.fn((..._args: unknown[]) => makeChain());
const mockDbInsert = vi.fn((..._args: unknown[]) => makeChain());

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect(...args),
    update: (...args: unknown[]) => mockDbUpdate(...args),
    insert: (...args: unknown[]) => mockDbInsert(...args),
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
  ...(await vi.importActual('drizzle-orm')),
  eq: vi.fn().mockReturnValue({ __eq: true }),
  and: vi.fn().mockReturnValue({ __and: true }),
  desc: vi.fn().mockReturnValue({ __desc: true }),
  isNull: vi.fn().mockReturnValue({ __isNull: true }),
  sql: Object.assign(vi.fn().mockReturnValue({ __sql: 'mocked' }), {
    raw: vi.fn().mockReturnValue({ __raw: true }),
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import type { Mock } from 'vitest';
import {
  createProvider,
  getDefaultChatProvider,
  getEmbeddingProvider,
  generateEmbeddings,
  updateProviderSettings,
  setProviderEnabled,
  setDefaultProvider,
  addUserProvider,
} from '../providers/index';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeDbRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    provider: 'groq',
    is_enabled: true,
    is_default: true,
    settings: { api_key: 'gsk_test', model: 'llama-3.3-70b' },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDbSelect.mockImplementation(() => makeChain([]));
  mockDbUpdate.mockImplementation(() => makeChain());
  mockDbInsert.mockImplementation(() => makeChain());

  mockOllamaIsAvailable.mockResolvedValue(false);
  mockGroqIsAvailable.mockResolvedValue(true);
  mockOpenRouterIsAvailable.mockResolvedValue(false);
  mockOllamaEmbed.mockResolvedValue({ embeddings: [[0.1, 0.2, 0.3]] });
  mockOpenRouterEmbed.mockResolvedValue({ embeddings: [[0.4, 0.5, 0.6]] });
});

// ============================================================================
// createProvider
// ============================================================================

describe('createProvider', () => {
  it('creates an OllamaProvider for "ollama"', () => {
    const provider = createProvider('ollama');
    expect(provider).toBeDefined();
    expect(typeof provider.isAvailable).toBe('function');
  });

  it('creates a GroqProvider for "groq"', () => {
    const provider = createProvider('groq', { apiKey: 'test' });
    expect(provider).toBeDefined();
    expect(typeof provider.isAvailable).toBe('function');
  });

  it('creates an OpenRouterProvider for "openrouter"', () => {
    const provider = createProvider('openrouter');
    expect(provider).toBeDefined();
    expect(typeof provider.isAvailable).toBe('function');
  });

  it('throws for an unknown provider name', () => {
    expect(() => createProvider('unknown' as never)).toThrow('Unknown provider: unknown');
  });
});

// ============================================================================
// getDefaultChatProvider — fallback chain
// ============================================================================

describe('getDefaultChatProvider', () => {
  it('uses user default when userId given and provider is available', async () => {
    // User settings: groq is enabled+default
    mockDbSelect
      .mockReturnValueOnce(makeChain([makeDbRow({ provider: 'groq' })]))
      .mockReturnValue(makeChain([]));

    mockGroqIsAvailable.mockResolvedValueOnce(true);

    const provider = await getDefaultChatProvider('user-1');

    // DB queried for user settings
    expect(mockDbSelect).toHaveBeenCalledTimes(1);
    expect(mockGroqIsAvailable).toHaveBeenCalledTimes(1);
    expect(provider).toBeDefined();
  });

  it('falls through to system default when user provider is unavailable', async () => {
    // User settings: groq (unavailable) → system: groq (available)
    mockDbSelect
      .mockReturnValueOnce(makeChain([makeDbRow({ provider: 'groq' })])) // user
      .mockReturnValueOnce(makeChain([makeDbRow({ provider: 'groq' })])); // system

    mockGroqIsAvailable
      .mockResolvedValueOnce(false) // user provider check
      .mockResolvedValueOnce(true); // system default check

    const provider = await getDefaultChatProvider('user-1');

    expect(mockDbSelect).toHaveBeenCalledTimes(2);
    expect(mockGroqIsAvailable).toHaveBeenCalledTimes(2);
    expect(provider).toBeDefined();
  });

  it('uses first available fallback when system default is unavailable', async () => {
    // System: groq (default, unavailable) + openrouter (fallback, available)
    mockDbSelect.mockReturnValueOnce(
      makeChain([
        makeDbRow({ provider: 'groq', is_default: true }),
        makeDbRow({ provider: 'openrouter', is_default: false }),
      ]),
    );

    // groq fails both the system-default check AND the fallback loop check
    mockGroqIsAvailable
      .mockResolvedValueOnce(false) // system default check
      .mockResolvedValueOnce(false); // fallback loop iteration
    mockOpenRouterIsAvailable.mockResolvedValueOnce(true); // consumed here

    const provider = await getDefaultChatProvider();

    expect(provider).toBeDefined();
    expect(mockOpenRouterIsAvailable).toHaveBeenCalledTimes(1);
  });

  it('throws when no providers are available', async () => {
    mockDbSelect.mockReturnValueOnce(
      makeChain([makeDbRow({ provider: 'groq', is_default: true })]),
    );
    mockGroqIsAvailable.mockResolvedValue(false); // override beforeEach default (true)

    // User-facing message is intentionally German (Swiss app). Assert on the
    // stable lead-in, not the volatile "Geprüft: <provider list>" tail.
    await expect(getDefaultChatProvider()).rejects.toThrow('Kein KI-Anbieter verfügbar');
  });

  it('queries only system settings when no userId is given', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([makeDbRow({ provider: 'groq' })]));
    mockGroqIsAvailable.mockResolvedValueOnce(true);

    await getDefaultChatProvider();

    expect(mockDbSelect).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// getEmbeddingProvider
// ============================================================================

describe('getEmbeddingProvider', () => {
  it('returns Ollama when available', async () => {
    mockOllamaIsAvailable.mockResolvedValueOnce(true);

    const provider = await getEmbeddingProvider();

    expect(mockOllamaIsAvailable).toHaveBeenCalledTimes(1);
    expect(mockOpenRouterIsAvailable).not.toHaveBeenCalled();
    expect(provider).toBeDefined();
  });

  it('falls back to OpenRouter when Ollama is unavailable', async () => {
    mockOllamaIsAvailable.mockResolvedValueOnce(false);
    mockOpenRouterIsAvailable.mockResolvedValueOnce(true);

    const provider = await getEmbeddingProvider();

    expect(mockOllamaIsAvailable).toHaveBeenCalledTimes(1);
    expect(mockOpenRouterIsAvailable).toHaveBeenCalledTimes(1);
    expect(provider).toBeDefined();
  });

  it('throws when neither Ollama nor OpenRouter is available', async () => {
    // beforeEach already sets mockResolvedValue(false) for both — no once needed

    await expect(getEmbeddingProvider()).rejects.toThrow('No embedding provider available');
  });
});

// ============================================================================
// generateEmbeddings
// ============================================================================

describe('generateEmbeddings', () => {
  it('delegates embed() call to the embedding provider', async () => {
    mockOllamaIsAvailable.mockResolvedValueOnce(true);
    mockOllamaEmbed.mockResolvedValueOnce({ embeddings: [[0.1, 0.2]] });

    const result = await generateEmbeddings({ input: ['hello'] });

    expect(mockOllamaEmbed).toHaveBeenCalledWith({ input: ['hello'] });
    expect(result.embeddings[0]).toEqual([0.1, 0.2]);
  });
});

// ============================================================================
// DB mutation functions
// ============================================================================

describe('updateProviderSettings', () => {
  it('calls db.update once', async () => {
    await updateProviderSettings('groq', { model: 'new-model' });
    expect(mockDbUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('setProviderEnabled', () => {
  it('calls db.update once', async () => {
    await setProviderEnabled('groq', false);
    expect(mockDbUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('setDefaultProvider', () => {
  it('calls db.update twice (unset all, then set specific)', async () => {
    await setDefaultProvider('groq');
    expect(mockDbUpdate).toHaveBeenCalledTimes(2);
  });
});

describe('addUserProvider', () => {
  it('calls db.insert once', async () => {
    await addUserProvider('user-1', 'groq', { api_key: 'gsk_test' });
    expect(mockDbInsert).toHaveBeenCalledTimes(1);
  });
});
