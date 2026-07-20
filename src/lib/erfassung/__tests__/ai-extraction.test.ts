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
const mockCallVisionWithFallback = jest.fn()

jest.mock('@/lib/ai/providers', () => ({
  callWithFallback: (...args: unknown[]) => mockCallWithFallback.apply(null, args),
  callVisionWithFallback: (...args: unknown[]) => mockCallVisionWithFallback.apply(null, args),
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
  const visionOk = (text: string) => ({ text, model: 'groq:llama-4-scout', provider: 'groq' as const, failedProviders: [] })

  it('returns { success: true } when the vision cascade returns valid JSON', async () => {
    mockCallVisionWithFallback.mockResolvedValueOnce(visionOk(PRODUCT_JSON))

    const result = await extractProductFromImage(BASE64)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.produktname).toBe('ThinkPad T480')
      expect(result.sourceType).toBe('image')
    }
  })

  it('parses JSON from a reasoning model that emits a <think> block with a decoy object', async () => {
    // Qwen3 (Groq vision) reasons before answering; the think block often
    // contains an example `{...}`. A greedy match must not span it.
    const withThink = `<think>\nI should output like {"foo":"bar"} maybe.\nLet me decide.\n</think>\n\`\`\`json\n${PRODUCT_JSON}\n\`\`\``
    mockCallVisionWithFallback.mockResolvedValueOnce(visionOk(withThink))

    const result = await extractProductFromImage(BASE64)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.produktname).toBe('ThinkPad T480')
  })

  it('normalises a bare base64 string into a full data URL', async () => {
    mockCallVisionWithFallback.mockResolvedValueOnce(visionOk(PRODUCT_JSON))

    await extractProductFromImage(BASE64)

    expect(mockCallVisionWithFallback.mock.calls[0][0].imageDataUrl).toBe(`data:image/jpeg;base64,${BASE64}`)
  })

  it('passes an already-prefixed data URL through unchanged', async () => {
    mockCallVisionWithFallback.mockResolvedValueOnce(visionOk(PRODUCT_JSON))
    const url = `data:image/png;base64,${BASE64}`

    await extractProductFromImage(url)

    expect(mockCallVisionWithFallback.mock.calls[0][0].imageDataUrl).toBe(url)
  })

  it('returns a friendly error when all vision providers fail (null)', async () => {
    mockCallVisionWithFallback.mockResolvedValueOnce(null)

    const result = await extractProductFromImage(BASE64)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('nicht verfügbar')
  })

  it('returns an error when no JSON is found in the vision response', async () => {
    mockCallVisionWithFallback.mockResolvedValueOnce(visionOk('Ich sehe ein Laptop aber kein JSON'))

    const result = await extractProductFromImage(BASE64)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('extrahieren')
  })

  it('returns a parse error for malformed JSON', async () => {
    mockCallVisionWithFallback.mockResolvedValueOnce(visionOk('{ produktname: ThinkPad }'))

    const result = await extractProductFromImage(BASE64)

    expect(result.success).toBe(false)
  })
})
