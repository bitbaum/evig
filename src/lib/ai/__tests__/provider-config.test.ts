/**
 * Tests for AI provider config loading
 *
 * Ensures env vars are used as fallback when DB has no api_key,
 * and DB disable flags are respected.
 */

import { __resetProviderCache, __loadProviderRuntimeConfig } from '@/lib/ai/providers'

// Mock the DB query module
jest.mock('@/lib/auth/db', () => ({
  query: jest.fn(),
}))

const { query } = jest.requireMock('@/lib/auth/db') as { query: jest.Mock }

// Save original env
const originalEnv = { ...process.env }

beforeEach(() => {
  jest.clearAllMocks()
  __resetProviderCache()
  // Set known env vars
  process.env.GROQ_API_KEY = 'env-groq-key'
  process.env.OPENROUTER_API_KEY = 'env-openrouter-key'
  process.env.OLLAMA_MODEL = 'llama3.2'
})

afterEach(() => {
  // Restore env
  process.env = { ...originalEnv }
})

describe('loadProviderRuntimeConfig', () => {
  it('uses env vars when no DB rows exist', async () => {
    query.mockResolvedValue({ rows: [] })

    const config = await __loadProviderRuntimeConfig()

    expect(config.groqApiKey).toBe('env-groq-key')
    expect(config.openRouterApiKey).toBe('env-openrouter-key')
    expect(config.groqEnabled).toBe(true)
    expect(config.openRouterEnabled).toBe(true)
  })

  it('uses DB api_key when present', async () => {
    query.mockResolvedValue({
      rows: [
        { provider: 'groq', is_enabled: true, settings: { api_key: 'db-groq-key' } },
      ],
    })

    const config = await __loadProviderRuntimeConfig()

    expect(config.groqApiKey).toBe('db-groq-key')
    // OpenRouter not in DB → falls back to env
    expect(config.openRouterApiKey).toBe('env-openrouter-key')
  })

  it('falls back to env var when DB row is enabled but has no api_key', async () => {
    // This is the exact bug scenario: DB has is_enabled=true but no api_key
    query.mockResolvedValue({
      rows: [
        { provider: 'groq', is_enabled: true, settings: {} },
        { provider: 'openrouter', is_enabled: true, settings: null },
      ],
    })

    const config = await __loadProviderRuntimeConfig()

    // Should fall back to env vars, NOT empty string
    expect(config.groqApiKey).toBe('env-groq-key')
    expect(config.openRouterApiKey).toBe('env-openrouter-key')
  })

  it('returns empty key when provider is explicitly disabled in DB', async () => {
    query.mockResolvedValue({
      rows: [
        { provider: 'groq', is_enabled: false, settings: { api_key: 'db-groq-key' } },
      ],
    })

    const config = await __loadProviderRuntimeConfig()

    // Disabled in DB → empty, even if DB has a key
    expect(config.groqApiKey).toBe('')
    expect(config.groqEnabled).toBe(false)
  })

  it('falls back to env vars when DB query fails', async () => {
    query.mockRejectedValue(new Error('Connection refused'))

    const config = await __loadProviderRuntimeConfig()

    expect(config.groqApiKey).toBe('env-groq-key')
    expect(config.openRouterApiKey).toBe('env-openrouter-key')
    expect(config.groqEnabled).toBe(true)
  })

  it('caches config and reuses on second call', async () => {
    query.mockResolvedValue({ rows: [] })

    await __loadProviderRuntimeConfig()
    await __loadProviderRuntimeConfig()

    // Only one DB query despite two calls
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('respects DB disable even when env var is set', async () => {
    process.env.GROQ_API_KEY = 'env-groq-key'

    query.mockResolvedValue({
      rows: [
        { provider: 'groq', is_enabled: false, settings: {} },
      ],
    })

    const config = await __loadProviderRuntimeConfig()

    expect(config.groqEnabled).toBe(false)
    expect(config.groqApiKey).toBe('')
  })

  it('handles all three providers from DB correctly', async () => {
    query.mockResolvedValue({
      rows: [
        { provider: 'groq', is_enabled: true, settings: { api_key: 'db-groq' } },
        { provider: 'openrouter', is_enabled: true, settings: { api_key: 'db-or' } },
        { provider: 'ollama', is_enabled: true, settings: { base_url: 'http://custom:11434', model: 'mistral' } },
      ],
    })

    const config = await __loadProviderRuntimeConfig()

    expect(config.groqApiKey).toBe('db-groq')
    expect(config.openRouterApiKey).toBe('db-or')
    expect(config.ollamaUrl).toBe('http://custom:11434')
    expect(config.ollamaModel).toBe('mistral')
  })
})
