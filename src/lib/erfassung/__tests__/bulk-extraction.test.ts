/**
 * @jest-environment node
 *
 * Tests for lib/erfassung/bulk-extraction.ts
 *
 * Behaviors locked:
 *   extractMultipleProducts - empty input, AI array, AI single object, AI null→fallback
 *   fallbackParse (via AI null) - brand, price, condition, category, multiple lines, sourceType
 */

const mockCallWithFallback = jest.fn()

jest.mock('@/lib/ai/providers', () => ({
  callWithFallback: (...args: unknown[]) => mockCallWithFallback(...args),
}))

jest.mock('@/lib/ai/config/prompts', () => ({
  ERFASSUNG_PROMPTS: {
    system: 'You are a product extractor.',
    extractMulti: 'Extract: {text}. Schema: {schema}',
    schema: '{}',
  },
  fillPromptTemplate: (_tmpl: string, vars: Record<string, string>) => vars.text,
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { extractMultipleProducts } from '../bulk-extraction'

beforeEach(() => {
  jest.resetAllMocks()
})

// ============================================================================
// extractMultipleProducts — input guards
// ============================================================================

describe('extractMultipleProducts — empty input', () => {
  it('returns [] for empty string without calling AI', async () => {
    const result = await extractMultipleProducts('')
    expect(result).toEqual([])
    expect(mockCallWithFallback).not.toHaveBeenCalled()
  })

  it('returns [] for whitespace-only string without calling AI', async () => {
    const result = await extractMultipleProducts('   ')
    expect(result).toEqual([])
    expect(mockCallWithFallback).not.toHaveBeenCalled()
  })
})

// ============================================================================
// extractMultipleProducts — AI success paths
// ============================================================================

describe('extractMultipleProducts — AI returns JSON array', () => {
  it('parses array and maps each item to a BulkProduct', async () => {
    const aiData = [
      { hersteller: 'Dell', produktname: 'Latitude 5540', kurzbeschreibung: 'Dell Laptop', specs: [], verkaufspreis: '350', zustand: 'good', hauptkategorie: '10', unterkategorie: '', kundenprofile: [] },
      { hersteller: 'HP', produktname: 'EliteBook 840', kurzbeschreibung: 'HP Laptop', specs: [], verkaufspreis: '299', zustand: 'like_new', hauptkategorie: '10', unterkategorie: '', kundenprofile: [] },
    ]
    mockCallWithFallback.mockResolvedValue({ text: JSON.stringify(aiData), provider: 'groq' })

    const result = await extractMultipleProducts('Dell Latitude 5540 350\nHP EliteBook 840 299')
    expect(result).toHaveLength(2)
    expect(result[0].hersteller).toBe('Dell')
    expect(result[1].hersteller).toBe('HP')
    expect(mockCallWithFallback).toHaveBeenCalledTimes(1)
  })
})

describe('extractMultipleProducts — AI returns single object', () => {
  it('wraps single object in array', async () => {
    const aiData = { hersteller: 'Lenovo', produktname: 'ThinkPad T480', kurzbeschreibung: 'Lenovo ThinkPad', specs: [], verkaufspreis: '400', zustand: 'good', hauptkategorie: '10', unterkategorie: '', kundenprofile: [] }
    // Response has no array brackets — only a single JSON object
    mockCallWithFallback.mockResolvedValue({ text: `Here is the product:\n${JSON.stringify(aiData)}`, provider: 'groq' })

    const result = await extractMultipleProducts('Lenovo ThinkPad T480 400')
    expect(result).toHaveLength(1)
    expect(result[0].hersteller).toBe('Lenovo')
  })
})

describe('extractMultipleProducts — AI fails or returns no JSON', () => {
  it('falls back to fallbackParse when AI returns null', async () => {
    mockCallWithFallback.mockResolvedValue(null)
    const result = await extractMultipleProducts('Dell Latitude 5540 350')
    expect(result).toHaveLength(1)
    expect(result[0].hersteller).toBe('Dell')
  })

  it('falls back to fallbackParse when AI response has no JSON', async () => {
    mockCallWithFallback.mockResolvedValue({ text: 'Sorry, I cannot extract products.', provider: 'groq' })
    const result = await extractMultipleProducts('HP EliteBook 840 299')
    expect(result).toHaveLength(1)
    expect(result[0].hersteller).toBe('HP')
  })
})

// ============================================================================
// fallbackParse — brand extraction (via AI null)
// ============================================================================

describe('fallbackParse — brand extraction', () => {
  beforeEach(() => {
    mockCallWithFallback.mockResolvedValue(null)
  })

  it('extracts Dell brand', async () => {
    const [product] = await extractMultipleProducts('Dell Latitude 5540')
    expect(product.hersteller).toBe('Dell')
  })

  it('extracts HP brand', async () => {
    const [product] = await extractMultipleProducts('HP EliteBook 840 G7')
    expect(product.hersteller).toBe('HP')
  })

  it('extracts Lenovo brand', async () => {
    const [product] = await extractMultipleProducts('Lenovo ThinkPad T480 i5 16GB')
    expect(product.hersteller).toBe('Lenovo')
  })

  it('extracts Apple brand', async () => {
    const [product] = await extractMultipleProducts('Apple MacBook Pro 2020')
    expect(product.hersteller).toBe('Apple')
  })

  it('leaves hersteller empty for unknown brand', async () => {
    const [product] = await extractMultipleProducts('Generic Office Computer 250')
    expect(product.hersteller).toBe('')
  })
})

// ============================================================================
// fallbackParse — price extraction
// ============================================================================

describe('fallbackParse — price extraction', () => {
  beforeEach(() => {
    mockCallWithFallback.mockResolvedValue(null)
  })

  it('extracts price from end of line', async () => {
    const [product] = await extractMultipleProducts('Dell Latitude 5540 350')
    expect(product.verkaufspreis).toBe('350')
  })

  it('extracts price with CHF suffix', async () => {
    const [product] = await extractMultipleProducts('HP EliteBook 840 299 CHF')
    expect(product.verkaufspreis).toBe('299')
  })

  it('ignores price below minimum threshold (< 10)', async () => {
    const [product] = await extractMultipleProducts('Laptop model X5 9')
    expect(product.verkaufspreis).toBe('')
  })

  it('ignores price above maximum threshold (> 9999)', async () => {
    const [product] = await extractMultipleProducts('Workstation 12000')
    expect(product.verkaufspreis).toBe('')
  })
})

// ============================================================================
// fallbackParse — condition extraction
// ============================================================================

describe('fallbackParse — condition extraction', () => {
  beforeEach(() => {
    mockCallWithFallback.mockResolvedValue(null)
  })

  it('maps "gut" to good', async () => {
    const [product] = await extractMultipleProducts('Dell Latitude gut 350')
    expect(product.zustand).toBe('good')
  })

  it('maps "sehr gut" to like_new', async () => {
    const [product] = await extractMultipleProducts('HP EliteBook sehr gut 299')
    expect(product.zustand).toBe('like_new')
  })

  it('maps "neu" to new', async () => {
    const [product] = await extractMultipleProducts('Lenovo ThinkPad neu 500')
    expect(product.zustand).toBe('new')
  })

  it('maps "gebraucht" to fair', async () => {
    const [product] = await extractMultipleProducts('Dell OptiPlex gebraucht 150')
    expect(product.zustand).toBe('fair')
  })

  it('defaults to good when no condition keyword found', async () => {
    const [product] = await extractMultipleProducts('HP EliteBook 840')
    expect(product.zustand).toBe('good')
  })
})

// ============================================================================
// fallbackParse — category detection
// ============================================================================

describe('fallbackParse — category detection', () => {
  beforeEach(() => {
    mockCallWithFallback.mockResolvedValue(null)
  })

  it('detects Laptops category for ThinkPad', async () => {
    const [product] = await extractMultipleProducts('Lenovo ThinkPad T480 400')
    expect(product.hauptkategorie).toBe('10')
  })

  it('detects Desktop PCs category for OptiPlex', async () => {
    const [product] = await extractMultipleProducts('Dell OptiPlex 7050 200')
    expect(product.hauptkategorie).toBe('20')
  })

  it('detects Monitore category for UltraSharp', async () => {
    const [product] = await extractMultipleProducts('Dell UltraSharp 24 150')
    expect(product.hauptkategorie).toBe('30')
  })

  it('detects Tablets category for iPad', async () => {
    const [product] = await extractMultipleProducts('Apple iPad Pro 2021 500')
    expect(product.hauptkategorie).toBe('40')
  })

  it('leaves hauptkategorie empty for unrecognized product', async () => {
    const [product] = await extractMultipleProducts('Some random device 100')
    expect(product.hauptkategorie).toBe('')
  })
})

// ============================================================================
// fallbackParse — multiple lines and sourceType
// ============================================================================

describe('fallbackParse — multiple lines', () => {
  beforeEach(() => {
    mockCallWithFallback.mockResolvedValue(null)
  })

  it('produces one BulkProduct per non-empty line', async () => {
    const text = 'Dell Latitude 5540 350\nHP EliteBook 840 299\nLenovo ThinkPad T480 400'
    const result = await extractMultipleProducts(text)
    expect(result).toHaveLength(3)
  })

  it('skips lines shorter than 5 characters', async () => {
    const text = 'Dell Latitude 5540 350\nok\nHP EliteBook 840 299'
    const result = await extractMultipleProducts(text)
    expect(result).toHaveLength(2)
  })
})

describe('fallbackParse — sourceType propagation', () => {
  it('sets _source to text by default', async () => {
    mockCallWithFallback.mockResolvedValue(null)
    const [product] = await extractMultipleProducts('Dell Latitude 5540 350')
    expect(product._source).toBe('text')
  })

  it('sets _source to voice when specified', async () => {
    mockCallWithFallback.mockResolvedValue(null)
    const [product] = await extractMultipleProducts('Dell Latitude 5540 350', 'voice')
    expect(product._source).toBe('voice')
  })
})
