/**
 * Tests for AI provider config loading
 *
 * Ensures env vars are used as fallback when DB has no api_key,
 * and DB disable flags are respected.
 */

import type { Mock } from 'vitest';
import { __resetProviderCache, __loadProviderRuntimeConfig } from '@/lib/ai/providers';

// Drizzle chain mock
const mockSelectChain = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue([]),
};

vi.mock('@/db', () => ({
  db: {
    selectDistinctOn: vi.fn((..._args: unknown[]) => mockSelectChain),
  },
}));

vi.mock('@/db/schema', () => ({
  hirnProviderSettings: {
    provider: 'provider',
    isEnabled: 'is_enabled',
    settings: 'settings',
    scope: 'scope',
    isDefault: 'is_default',
    updatedAt: 'updated_at',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  desc: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/config/urls', () => ({
  OLLAMA_URL: 'http://localhost:11434',
}));

// Save original env
const originalEnv = { ...process.env };

function makeRow(provider: string, isEnabled: boolean, settings: Record<string, unknown> | null) {
  return { provider, isEnabled, settings };
}

beforeEach(() => {
  vi.clearAllMocks();
  __resetProviderCache();
  // Set known env vars
  process.env.GROQ_API_KEY = 'env-groq-key';
  process.env.OPENROUTER_API_KEY = 'env-openrouter-key';
  process.env.OLLAMA_MODEL = 'llama3.2';
  // Default: empty DB
  mockSelectChain.orderBy.mockResolvedValue([]);
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('loadProviderRuntimeConfig', () => {
  it('uses env vars when no DB rows exist', async () => {
    const config = await __loadProviderRuntimeConfig();

    expect(config.groqApiKey).toBe('env-groq-key');
    expect(config.openRouterApiKey).toBe('env-openrouter-key');
    expect(config.groqEnabled).toBe(true);
    expect(config.openRouterEnabled).toBe(true);
  });

  it('uses DB api_key when present', async () => {
    mockSelectChain.orderBy.mockResolvedValueOnce([
      makeRow('groq', true, { api_key: 'db-groq-key' }),
    ]);

    const config = await __loadProviderRuntimeConfig();

    expect(config.groqApiKey).toBe('db-groq-key');
    // OpenRouter not in DB → falls back to env
    expect(config.openRouterApiKey).toBe('env-openrouter-key');
  });

  it('falls back to env var when DB row is enabled but has no api_key', async () => {
    mockSelectChain.orderBy.mockResolvedValueOnce([
      makeRow('groq', true, {}),
      makeRow('openrouter', true, null),
    ]);

    const config = await __loadProviderRuntimeConfig();

    // Should fall back to env vars, NOT empty string
    expect(config.groqApiKey).toBe('env-groq-key');
    expect(config.openRouterApiKey).toBe('env-openrouter-key');
  });

  it('returns empty key when provider is explicitly disabled in DB', async () => {
    mockSelectChain.orderBy.mockResolvedValueOnce([
      makeRow('groq', false, { api_key: 'db-groq-key' }),
    ]);

    const config = await __loadProviderRuntimeConfig();

    // Disabled in DB → empty, even if DB has a key
    expect(config.groqApiKey).toBe('');
    expect(config.groqEnabled).toBe(false);
  });

  it('falls back to env vars when DB query fails', async () => {
    mockSelectChain.orderBy.mockRejectedValueOnce(new Error('Connection refused'));

    const config = await __loadProviderRuntimeConfig();

    expect(config.groqApiKey).toBe('env-groq-key');
    expect(config.openRouterApiKey).toBe('env-openrouter-key');
    expect(config.groqEnabled).toBe(true);
  });

  it('caches config and reuses on second call', async () => {
    const { db } = (await import('@/db')) as unknown as { db: { selectDistinctOn: Mock } };

    await __loadProviderRuntimeConfig();
    await __loadProviderRuntimeConfig();

    // Only one DB query despite two calls
    expect(db.selectDistinctOn).toHaveBeenCalledTimes(1);
  });

  it('respects DB disable even when env var is set', async () => {
    process.env.GROQ_API_KEY = 'env-groq-key';

    mockSelectChain.orderBy.mockResolvedValueOnce([makeRow('groq', false, {})]);

    const config = await __loadProviderRuntimeConfig();

    expect(config.groqEnabled).toBe(false);
    expect(config.groqApiKey).toBe('');
  });

  it('handles all three providers from DB correctly', async () => {
    mockSelectChain.orderBy.mockResolvedValueOnce([
      makeRow('groq', true, { api_key: 'db-groq' }),
      makeRow('openrouter', true, { api_key: 'db-or' }),
      makeRow('ollama', true, { base_url: 'http://custom:11434', model: 'mistral' }),
    ]);

    const config = await __loadProviderRuntimeConfig();

    expect(config.groqApiKey).toBe('db-groq');
    expect(config.openRouterApiKey).toBe('db-or');
    expect(config.ollamaUrl).toBe('http://custom:11434');
    expect(config.ollamaModel).toBe('mistral');
  });
});
