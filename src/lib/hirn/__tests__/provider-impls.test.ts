/**
 * Tests for hirn/providers/{groq,ollama,openrouter}.ts — HTTP-level AI provider implementations.
 *
 * Mission-relevant: HIRN is the AI assistant staff use for decision support.
 * If GroqProvider silently returns empty content on an auth error, staff think
 * HIRN is "broken" rather than "misconfigured". If OllamaProvider misreads the
 * response format (Ollama uses data.message.content, not data.choices), every
 * local-model reply is empty.
 *
 * Behaviors locked:
 *   GroqProvider
 *   - chat: throws when API key is absent
 *   - chat: returns content + usage on success
 *   - chat: throws on non-ok HTTP response
 *   - chat: throws timeout message on AbortError
 *   - embed: always throws (Groq has no embeddings API)
 *   - isAvailable: false when no API key (no fetch)
 *   - isAvailable: true when /models responds ok
 *   - isAvailable: false on network error
 *
 *   OllamaProvider
 *   - chat: reads content from data.message.content (not choices)
 *   - chat: includes usage when eval_count present
 *   - chat: throws on non-ok HTTP response
 *   - chat: throws timeout message on AbortError
 *   - embed: returns embeddings array for single input
 *   - embed: throws on non-ok HTTP response
 *   - embed: throws when response has no embedding array
 *   - isAvailable: true when /api/tags responds ok
 *   - isAvailable: false on network error
 *   - listModels: returns array of model names
 *
 *   OpenRouterProvider
 *   - chat: throws when API key is absent
 *   - chat: returns content on success
 *   - chat: throws on non-ok HTTP response
 *   - chat: throws timeout message on AbortError
 *   - embed: always throws (OpenRouter has no embeddings API)
 *   - isAvailable: false when no API key (no fetch)
 *   - isAvailable: true when /models responds ok
 *   - isAvailable: false on network error
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function okResponse(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    body: null,
  } as unknown as Response)
}

function errorResponse(status: number, body = 'Error') {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.reject(new Error('not json')),
    text: () => Promise.resolve(body),
    body: null,
  } as unknown as Response)
}

function abortError() {
  const err = new Error('The user aborted a request.')
  err.name = 'AbortError'
  return Promise.reject(err)
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/urls', () => ({
  OLLAMA_URL: 'http://localhost:11434',
  APP_URL: 'http://localhost:3000',
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { GroqProvider } from '../providers/groq'
import { OllamaProvider } from '../providers/ollama'
import { OpenRouterProvider } from '../providers/openrouter'

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const MESSAGES = [{ role: 'user' as const, content: 'Hallo' }]

let originalFetch: typeof global.fetch
let originalGroqKey: string | undefined
let originalOpenRouterKey: string | undefined

beforeAll(() => {
  originalFetch = global.fetch
  originalGroqKey = process.env.GROQ_API_KEY
  originalOpenRouterKey = process.env.OPENROUTER_API_KEY
})

afterAll(() => {
  global.fetch = originalFetch
  if (originalGroqKey !== undefined) process.env.GROQ_API_KEY = originalGroqKey
  else delete process.env.GROQ_API_KEY
  if (originalOpenRouterKey !== undefined) process.env.OPENROUTER_API_KEY = originalOpenRouterKey
  else delete process.env.OPENROUTER_API_KEY
})

beforeEach(() => {
  jest.clearAllMocks()
  // Each test passes apiKey explicitly — prevent env vars from leaking in
  delete process.env.GROQ_API_KEY
  delete process.env.OPENROUTER_API_KEY
})

// ============================================================================
// GroqProvider
// ============================================================================

describe('GroqProvider — chat', () => {
  it('throws when API key is absent', async () => {
    const provider = new GroqProvider({ apiKey: '' })

    await expect(provider.chat({ messages: MESSAGES })).rejects.toThrow('Groq API key not configured')
  })

  it('returns content and usage on success', async () => {
    global.fetch = jest.fn().mockReturnValue(
      okResponse({
        choices: [{ message: { content: 'Guten Tag!' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      })
    )

    const provider = new GroqProvider({ apiKey: 'gsk_test' })
    const result = await provider.chat({ messages: MESSAGES })

    expect(result.content).toBe('Guten Tag!')
    expect(result.usage?.promptTokens).toBe(10)
    expect(result.usage?.completionTokens).toBe(5)
    expect(result.usage?.totalTokens).toBe(15)
    expect(result.provider).toBe('groq')
  })

  it('returns empty string when choices is missing content', async () => {
    global.fetch = jest.fn().mockReturnValue(okResponse({ choices: [] }))

    const provider = new GroqProvider({ apiKey: 'gsk_test' })
    const result = await provider.chat({ messages: MESSAGES })

    expect(result.content).toBe('')
  })

  it('throws on non-ok HTTP response', async () => {
    global.fetch = jest.fn().mockReturnValue(errorResponse(401, 'Unauthorized'))

    const provider = new GroqProvider({ apiKey: 'gsk_bad' })

    await expect(provider.chat({ messages: MESSAGES })).rejects.toThrow('Groq API error: 401')
  })

  it('throws descriptive timeout message on AbortError', async () => {
    global.fetch = jest.fn().mockReturnValue(abortError())

    const provider = new GroqProvider({ apiKey: 'gsk_test' })

    await expect(provider.chat({ messages: MESSAGES })).rejects.toThrow('Groq Zeitüberschreitung nach 30s')
  })
})

describe('GroqProvider — embed', () => {
  it('always throws (no embeddings API)', async () => {
    const provider = new GroqProvider({ apiKey: 'gsk_test' })

    await expect(provider.embed({ input: 'text' })).rejects.toThrow('Groq does not support embeddings')
  })
})

describe('GroqProvider — isAvailable', () => {
  it('returns false immediately when no API key (no fetch)', async () => {
    global.fetch = jest.fn()

    const provider = new GroqProvider({ apiKey: '' })
    const result = await provider.isAvailable()

    expect(result).toBe(false)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns true when /models responds ok', async () => {
    global.fetch = jest.fn().mockReturnValue(okResponse({ data: [] }))

    const provider = new GroqProvider({ apiKey: 'gsk_test' })
    const result = await provider.isAvailable()

    expect(result).toBe(true)
  })

  it('returns false on network error', async () => {
    global.fetch = jest.fn().mockReturnValue(Promise.reject(new Error('ECONNREFUSED')))

    const provider = new GroqProvider({ apiKey: 'gsk_test' })
    const result = await provider.isAvailable()

    expect(result).toBe(false)
  })
})

// ============================================================================
// OllamaProvider
// ============================================================================

describe('OllamaProvider — chat', () => {
  it('reads content from data.message.content', async () => {
    global.fetch = jest.fn().mockReturnValue(
      okResponse({ message: { content: 'Hallo von Ollama' } })
    )

    const provider = new OllamaProvider()
    const result = await provider.chat({ messages: MESSAGES })

    expect(result.content).toBe('Hallo von Ollama')
    expect(result.provider).toBe('ollama')
  })

  it('includes usage when eval_count is present', async () => {
    global.fetch = jest.fn().mockReturnValue(
      okResponse({
        message: { content: 'Text' },
        eval_count: 42,
        prompt_eval_count: 10,
      })
    )

    const provider = new OllamaProvider()
    const result = await provider.chat({ messages: MESSAGES })

    expect(result.usage?.completionTokens).toBe(42)
    expect(result.usage?.promptTokens).toBe(10)
    expect(result.usage?.totalTokens).toBe(52)
  })

  it('omits usage when eval_count is absent', async () => {
    global.fetch = jest.fn().mockReturnValue(
      okResponse({ message: { content: 'Text' } })
    )

    const provider = new OllamaProvider()
    const result = await provider.chat({ messages: MESSAGES })

    expect(result.usage).toBeUndefined()
  })

  it('throws on non-ok HTTP response', async () => {
    global.fetch = jest.fn().mockReturnValue(errorResponse(503, 'Service unavailable'))

    const provider = new OllamaProvider()

    await expect(provider.chat({ messages: MESSAGES })).rejects.toThrow('Ollama API error: 503')
  })

  it('throws descriptive timeout message on AbortError', async () => {
    global.fetch = jest.fn().mockReturnValue(abortError())

    const provider = new OllamaProvider()

    await expect(provider.chat({ messages: MESSAGES })).rejects.toThrow('Ollama Zeitüberschreitung nach 60s')
  })
})

describe('OllamaProvider — embed', () => {
  it('returns embeddings array for single input', async () => {
    global.fetch = jest.fn().mockReturnValue(
      okResponse({ embedding: [0.1, 0.2, 0.3] })
    )

    const provider = new OllamaProvider()
    const result = await provider.embed({ input: 'test text' })

    expect(result.embeddings).toHaveLength(1)
    expect(result.embeddings[0]).toEqual([0.1, 0.2, 0.3])
    expect(result.dimensions).toBe(3)
    expect(result.provider).toBe('ollama')
  })

  it('makes one fetch per input for multiple inputs', async () => {
    global.fetch = jest.fn()
      .mockReturnValueOnce(okResponse({ embedding: [0.1, 0.2] }))
      .mockReturnValueOnce(okResponse({ embedding: [0.3, 0.4] }))

    const provider = new OllamaProvider()
    const result = await provider.embed({ input: ['text1', 'text2'] })

    expect(result.embeddings).toHaveLength(2)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('throws on non-ok HTTP response', async () => {
    global.fetch = jest.fn().mockReturnValue(errorResponse(404, 'model not found'))

    const provider = new OllamaProvider()

    await expect(provider.embed({ input: 'text' })).rejects.toThrow('Ollama embeddings error: 404')
  })

  it('throws when response has no embedding array', async () => {
    global.fetch = jest.fn().mockReturnValue(okResponse({ embedding: null }))

    const provider = new OllamaProvider()

    await expect(provider.embed({ input: 'text' })).rejects.toThrow('Ollama returned no embedding array')
  })
})

describe('OllamaProvider — isAvailable', () => {
  it('returns true when /api/tags responds ok', async () => {
    global.fetch = jest.fn().mockReturnValue(okResponse({ models: [] }))

    const provider = new OllamaProvider()
    const result = await provider.isAvailable()

    expect(result).toBe(true)
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string
    expect(url).toContain('/api/tags')
  })

  it('returns false on network error', async () => {
    global.fetch = jest.fn().mockReturnValue(Promise.reject(new Error('ECONNREFUSED')))

    const provider = new OllamaProvider()
    const result = await provider.isAvailable()

    expect(result).toBe(false)
  })
})

describe('OllamaProvider — listModels', () => {
  it('returns array of model names', async () => {
    global.fetch = jest.fn().mockReturnValue(
      okResponse({ models: [{ name: 'llama3.2' }, { name: 'nomic-embed-text' }] })
    )

    const provider = new OllamaProvider()
    const models = await provider.listModels()

    expect(models).toEqual(['llama3.2', 'nomic-embed-text'])
  })

  it('throws when response is not ok', async () => {
    global.fetch = jest.fn().mockReturnValue(errorResponse(500))

    const provider = new OllamaProvider()

    await expect(provider.listModels()).rejects.toThrow('Failed to list Ollama models')
  })
})

// ============================================================================
// OpenRouterProvider
// ============================================================================

describe('OpenRouterProvider — chat', () => {
  it('throws when API key is absent', async () => {
    const provider = new OpenRouterProvider({ apiKey: '' })

    await expect(provider.chat({ messages: MESSAGES })).rejects.toThrow('OpenRouter API key not configured')
  })

  it('returns content on success', async () => {
    global.fetch = jest.fn().mockReturnValue(
      okResponse({
        choices: [{ message: { content: 'Antwort von OpenRouter' } }],
        usage: { prompt_tokens: 8, completion_tokens: 12, total_tokens: 20 },
      })
    )

    const provider = new OpenRouterProvider({ apiKey: 'sk-or-test' })
    const result = await provider.chat({ messages: MESSAGES })

    expect(result.content).toBe('Antwort von OpenRouter')
    expect(result.provider).toBe('openrouter')
    expect(result.usage?.totalTokens).toBe(20)
  })

  it('includes HTTP-Referer and X-Title headers', async () => {
    global.fetch = jest.fn().mockReturnValue(
      okResponse({ choices: [{ message: { content: '' } }] })
    )

    const provider = new OpenRouterProvider({ apiKey: 'sk-or-test' })
    await provider.chat({ messages: MESSAGES })

    const init = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers['HTTP-Referer']).toBe('http://localhost:3000')
    expect(headers['X-Title']).toBe('RevampIT Hirn')
  })

  it('throws on non-ok HTTP response', async () => {
    global.fetch = jest.fn().mockReturnValue(errorResponse(429, 'Rate limit exceeded'))

    const provider = new OpenRouterProvider({ apiKey: 'sk-or-test' })

    await expect(provider.chat({ messages: MESSAGES })).rejects.toThrow('OpenRouter API error: 429')
  })

  it('throws descriptive timeout message on AbortError', async () => {
    global.fetch = jest.fn().mockReturnValue(abortError())

    const provider = new OpenRouterProvider({ apiKey: 'sk-or-test' })

    await expect(provider.chat({ messages: MESSAGES })).rejects.toThrow('OpenRouter Zeitüberschreitung nach 30s')
  })
})

describe('OpenRouterProvider — embed', () => {
  it('always throws (no embeddings API)', async () => {
    const provider = new OpenRouterProvider({ apiKey: 'sk-or-test' })

    await expect(provider.embed({ input: 'text' })).rejects.toThrow('OpenRouter does not support embeddings')
  })
})

describe('OpenRouterProvider — isAvailable', () => {
  it('returns false immediately when no API key (no fetch)', async () => {
    global.fetch = jest.fn()

    const provider = new OpenRouterProvider({ apiKey: '' })
    const result = await provider.isAvailable()

    expect(result).toBe(false)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns true when /models responds ok', async () => {
    global.fetch = jest.fn().mockReturnValue(okResponse({ data: [] }))

    const provider = new OpenRouterProvider({ apiKey: 'sk-or-test' })
    const result = await provider.isAvailable()

    expect(result).toBe(true)
  })

  it('returns false on network error', async () => {
    global.fetch = jest.fn().mockReturnValue(Promise.reject(new Error('ECONNREFUSED')))

    const provider = new OpenRouterProvider({ apiKey: 'sk-or-test' })
    const result = await provider.isAvailable()

    expect(result).toBe(false)
  })
})
