/**
 * Tests for erfassung/ai-extraction.ts — AI-powered product data extraction.
 *
 * Mission-relevant: extraction is the first step in the donor→recipient flow.
 * If AI extraction silently fails without falling back to the regex parser,
 * staff can't record donated hardware. If empty input is accepted, corrupt
 * records enter the database.
 *
 * Behaviors locked:
 *   extractProductFromText
 *   - returns { success: false } for empty / blank input
 *   - returns { success: true, data, model } when AI returns parseable JSON
 *   - falls back to fast parser when AI returns no JSON match
 *   - falls back to fast parser when all AI providers fail (result=null)
 *   - fast-parser result carries model='fast-parser' and lower confidence
 *
 *   extractProductFromImage
 *   - returns { success: true } when Ollama vision responds with valid JSON
 *   - returns model-not-found error when Ollama response contains "model...not found"
 *   - returns generic error on non-ok HTTP response
 *   - returns error when no JSON found in Ollama response
 *   - returns connection-error message on fetch network failure
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCallWithFallback = jest.fn()

jest.mock('@/lib/ai/providers', () => ({
  callWithFallback: (...args: unknown[]) => mockCallWithFallback.apply(null, args),
}))

const mockFillPromptTemplate = jest.fn((template: string) => `PROMPT:${template}`)

// ERFASSUNG_PROMPTS is evaluated at module load time (module-level const), so
// it must be inlined in the factory — cannot reference a const from TDZ here.
jest.mock('@/lib/ai/config/prompts', () => ({
  ERFASSUNG_PROMPTS: {
    system: 'You are an extractor.',
    extract: 'Extract: {text}',
    schema: '{"produktname":"","hersteller":""}',
  },
  fillPromptTemplate: (...args: unknown[]) => mockFillPromptTemplate.apply(null, args),
}))

const mockCalculateFieldConfidence = jest.fn()
const mockFastParseProductText = jest.fn()

jest.mock('../ai-field-mapping', () => ({
  calculateFieldConfidence: (...args: unknown[]) => mockCalculateFieldConfidence.apply(null, args),
  generateVerificationSources: jest.fn().mockReturnValue([]),
}))

jest.mock('../ai-classification', () => ({
  fastParseProductText: (...args: unknown[]) => mockFastParseProductText.apply(null, args),
}))

jest.mock('@/config/urls', () => ({
  OLLAMA_URL: 'http://ollama.test:11434',
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { extractProductFromText, extractProductFromImage } from '../ai-extraction'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PRODUCT_JSON = JSON.stringify({
  produktname: 'ThinkPad T480',
  hersteller: 'Lenovo',
  kategorie: 'laptop',
  zustand: 'gut',
  preis: 299,
  beschreibung: '',
})

function makeMeta() {
  return {
    produktname: { confidence: 0.9, model: 'groq:llama', verified: false },
    hersteller: { confidence: 0.85, model: 'groq:llama', verified: false },
  }
}

function setupFieldConfidence(model = 'groq:llama-3.3-70b-versatile') {
  mockCalculateFieldConfidence.mockReturnValue({
    metadata: makeMeta(),
    allSources: [{ field: 'produktname', source: 'ai', confidence: 0.9 }],
  })
  return model
}

let savedFetch: typeof global.fetch

beforeAll(() => { savedFetch = global.fetch })
afterAll(() => { global.fetch = savedFetch })

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
  setupFieldConfidence()
  mockFastParseProductText.mockReturnValue({
    produktname: 'ThinkPad T480',
    hersteller: 'Lenovo',
    kategorie: 'laptop',
    zustand: 'gut',
    preis: 299,
  })
})

// ============================================================================
// extractProductFromText — input validation
// ============================================================================

describe('extractProductFromText — input validation', () => {
  it('returns { success: false } for empty string', async () => {
    const result = await extractProductFromText('')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBeTruthy()
  })

  it('returns { success: false } for blank/whitespace-only string', async () => {
    const result = await extractProductFromText('   ')
    expect(result.success).toBe(false)
  })

  it('does not call AI providers for empty input', async () => {
    await extractProductFromText('')
    expect(mockCallWithFallback).not.toHaveBeenCalled()
  })
})

// ============================================================================
// extractProductFromText — AI success path
// ============================================================================

describe('extractProductFromText — AI success', () => {
  it('returns success with parsed product data when AI returns JSON', async () => {
    mockCallWithFallback.mockResolvedValueOnce({
      text: `Here is the result:\n${PRODUCT_JSON}`,
      model: 'groq:llama-3.3-70b-versatile',
      provider: 'groq',
      failedProviders: [],
    })

    const result = await extractProductFromText('Lenovo ThinkPad T480 gut erhalten')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.produktname).toBe('ThinkPad T480')
      expect(result.model).toBe('groq:llama-3.3-70b-versatile')
      expect(result.sourceType).toBe('text')
    }
  })

  it('passes sourceType through to the result', async () => {
    mockCallWithFallback.mockResolvedValueOnce({
      text: PRODUCT_JSON,
      model: 'groq:llama',
      provider: 'groq',
      failedProviders: [],
    })

    const result = await extractProductFromText('T480', 'voice')

    expect(result.success).toBe(true)
    if (result.success) expect(result.sourceType).toBe('voice')
  })

  it('includes verificationSources in the result', async () => {
    mockCallWithFallback.mockResolvedValueOnce({
      text: PRODUCT_JSON,
      model: 'groq:llama',
      provider: 'groq',
      failedProviders: [],
    })

    const result = await extractProductFromText('T480')

    expect(result.success).toBe(true)
    if (result.success) expect(Array.isArray(result.verificationSources)).toBe(true)
  })
})

// ============================================================================
// extractProductFromText — fast parser fallback
// ============================================================================

describe('extractProductFromText — fast parser fallback', () => {
  it('falls back to fast parser when AI returns no JSON', async () => {
    mockCallWithFallback.mockResolvedValueOnce({
      text: 'Leider konnte ich keine Daten extrahieren.',
      model: 'groq:llama',
      provider: 'groq',
      failedProviders: [],
    })

    const result = await extractProductFromText('Lenovo ThinkPad')

    expect(result.success).toBe(true)
    if (result.success) expect(result.model).toBe('fast-parser')
    expect(mockFastParseProductText).toHaveBeenCalledTimes(1)
  })

  it('falls back to fast parser when all AI providers fail (result=null)', async () => {
    mockCallWithFallback.mockResolvedValueOnce(null)

    const result = await extractProductFromText('T480')

    expect(result.success).toBe(true)
    if (result.success) expect(result.model).toBe('fast-parser')
    expect(mockFastParseProductText).toHaveBeenCalledTimes(1)
  })

  it('fast parser path does not throw — always returns success', async () => {
    mockCallWithFallback.mockResolvedValueOnce(null)

    await expect(extractProductFromText('irgendwas')).resolves.toMatchObject({ success: true })
  })
})

// ============================================================================
// extractProductFromImage
// ============================================================================

describe('extractProductFromImage', () => {
  const BASE64 = 'aGVsbG8=' // "hello" in base64

  function ollamaOk(responseText: string) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ response: responseText }),
      text: () => Promise.resolve(''),
    })
  }

  function ollamaError(status: number, body: string) {
    return Promise.resolve({
      ok: false,
      status,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(body),
    })
  }

  it('returns { success: true } when Ollama returns valid JSON', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(ollamaOk(PRODUCT_JSON))

    const result = await extractProductFromImage(BASE64)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.produktname).toBe('ThinkPad T480')
      expect(result.sourceType).toBe('image')
    }
  })

  it('strips data URL prefix before sending', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(ollamaOk(PRODUCT_JSON))

    await extractProductFromImage(`data:image/jpeg;base64,${BASE64}`)

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(body.images[0]).toBe(BASE64) // no data:image prefix
  })

  it('returns model-not-found error when Ollama response contains "model...not found"', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      ollamaError(404, 'model llama3.2-vision not found')
    )

    const result = await extractProductFromImage(BASE64)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('nicht installiert')
      expect(result.error).toContain('ollama pull')
    }
  })

  it('returns generic error on non-ok HTTP response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(ollamaError(500, 'Internal error'))

    const result = await extractProductFromImage(BASE64)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBeTruthy()
  })

  it('returns error when no JSON found in Ollama response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      ollamaOk('Ich sehe ein Laptop aber kein JSON')
    )

    const result = await extractProductFromImage(BASE64)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBeTruthy()
  })

  it('returns connection error message on fetch failure', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('fetch failed: ECONNREFUSED'))

    const result = await extractProductFromImage(BASE64)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('nicht erreichbar')
  })

  it('returns generic error for unexpected exceptions', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('unexpected error'))

    const result = await extractProductFromImage(BASE64)

    expect(result.success).toBe(false)
  })
})
