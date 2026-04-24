/**
 * Tests for Erfassung Zod schemas (lib/schemas/erfassung.ts)
 *
 * Erfassung is the product intake flow — the first step in getting used
 * hardware processed and into the shop. Schema correctness is critical:
 * wrong validation means bad data enters inventory.
 *
 * Covers: erfassungPayloadSchema, verificationSourceSchema, aiFieldSourceSchema,
 *         bulkSaveRequestSchema, ErfassungRefineSchema, ErfassungTextSchema.
 */

import {
  erfassungPayloadSchema,
  verificationSourceSchema,
  aiFieldSourceSchema,
  specFieldSchema,
  bulkSaveRequestSchema,
  ErfassungRefineSchema,
  ErfassungTextSchema,
} from '../erfassung'

// ============================================================================
// erfassungPayloadSchema (the primary API payload)
// ============================================================================

describe('erfassungPayloadSchema', () => {
  const valid = {
    hersteller: 'Lenovo',
    produktname: 'ThinkPad X1 Carbon Gen 9',
    verkaufspreis: 450,
    zustand: 'gut',
  }

  it('accepts a minimal valid payload', () => {
    const result = erfassungPayloadSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects empty hersteller', () => {
    const result = erfassungPayloadSchema.safeParse({ ...valid, hersteller: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing hersteller', () => {
    const { hersteller, ...rest } = valid
    const result = erfassungPayloadSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects empty produktname', () => {
    const result = erfassungPayloadSchema.safeParse({ ...valid, produktname: '' })
    expect(result.success).toBe(false)
  })

  it('rejects negative verkaufspreis', () => {
    const result = erfassungPayloadSchema.safeParse({ ...valid, verkaufspreis: -1 })
    expect(result.success).toBe(false)
  })

  it('accepts verkaufspreis of 0 (free item)', () => {
    const result = erfassungPayloadSchema.safeParse({ ...valid, verkaufspreis: 0 })
    expect(result.success).toBe(true)
  })

  it('rejects empty zustand', () => {
    const result = erfassungPayloadSchema.safeParse({ ...valid, zustand: '' })
    expect(result.success).toBe(false)
  })

  it('accepts optional dimensions as numbers', () => {
    const result = erfassungPayloadSchema.safeParse({
      ...valid,
      laenge_mm: 300,
      breite_mm: 200,
      hoehe_mm: 15,
      gewicht_kg: 1.2,
    })
    expect(result.success).toBe(true)
  })

  it('accepts auf_lager as non-negative integer', () => {
    const result = erfassungPayloadSchema.safeParse({ ...valid, auf_lager: 5 })
    expect(result.success).toBe(true)
  })

  it('rejects auf_lager below 0', () => {
    const result = erfassungPayloadSchema.safeParse({ ...valid, auf_lager: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer auf_lager', () => {
    const result = erfassungPayloadSchema.safeParse({ ...valid, auf_lager: 2.5 })
    expect(result.success).toBe(false)
  })

  it('accepts valid action values', () => {
    for (const action of ['draft', 'erfassen', 'publish']) {
      const result = erfassungPayloadSchema.safeParse({ ...valid, action })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid action', () => {
    const result = erfassungPayloadSchema.safeParse({ ...valid, action: 'delete' })
    expect(result.success).toBe(false)
  })

  it('accepts kundenprofile as string array', () => {
    const result = erfassungPayloadSchema.safeParse({
      ...valid,
      kundenprofile: ['students', 'home-office'],
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// verificationSourceSchema
// ============================================================================

describe('verificationSourceSchema', () => {
  const valid = {
    title: 'Lenovo ThinkPad X1 Specs',
    url: 'https://www.lenovo.com/specs',
    type: 'manufacturer',
    relevance: 0.95,
  }

  it('accepts a valid verification source', () => {
    const result = verificationSourceSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects non-URL url', () => {
    const result = verificationSourceSchema.safeParse({ ...valid, url: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid type values', () => {
    for (const type of ['manufacturer', 'marketplace', 'review', 'specs', 'price']) {
      const result = verificationSourceSchema.safeParse({ ...valid, type })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid type', () => {
    const result = verificationSourceSchema.safeParse({ ...valid, type: 'social_media' })
    expect(result.success).toBe(false)
  })

  it('rejects relevance above 1', () => {
    const result = verificationSourceSchema.safeParse({ ...valid, relevance: 1.1 })
    expect(result.success).toBe(false)
  })

  it('rejects relevance below 0', () => {
    const result = verificationSourceSchema.safeParse({ ...valid, relevance: -0.1 })
    expect(result.success).toBe(false)
  })

  it('accepts relevance of exactly 0 and 1', () => {
    for (const relevance of [0, 1]) {
      const result = verificationSourceSchema.safeParse({ ...valid, relevance })
      expect(result.success).toBe(true)
    }
  })
})

// ============================================================================
// aiFieldSourceSchema
// ============================================================================

describe('aiFieldSourceSchema', () => {
  const valid = {
    type: 'voice',
    confidence: 0.87,
    timestamp: 1700000000000,
  }

  it('accepts a minimal valid AI field source', () => {
    const result = aiFieldSourceSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts all valid type values', () => {
    for (const type of ['voice', 'text', 'image', 'database']) {
      const result = aiFieldSourceSchema.safeParse({ ...valid, type })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid type', () => {
    const result = aiFieldSourceSchema.safeParse({ ...valid, type: 'sensor' })
    expect(result.success).toBe(false)
  })

  it('rejects confidence above 1', () => {
    const result = aiFieldSourceSchema.safeParse({ ...valid, confidence: 1.01 })
    expect(result.success).toBe(false)
  })

  it('rejects confidence below 0', () => {
    const result = aiFieldSourceSchema.safeParse({ ...valid, confidence: -0.1 })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// specFieldSchema
// ============================================================================

describe('specFieldSchema', () => {
  it('accepts valid key/value spec', () => {
    const result = specFieldSchema.safeParse({ key: 'RAM', value: '16 GB' })
    expect(result.success).toBe(true)
  })

  it('rejects missing key', () => {
    const result = specFieldSchema.safeParse({ value: '16 GB' })
    expect(result.success).toBe(false)
  })

  it('rejects missing value', () => {
    const result = specFieldSchema.safeParse({ key: 'RAM' })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// bulkSaveRequestSchema
// ============================================================================

describe('bulkSaveRequestSchema', () => {
  const validProduct = {
    hersteller: 'HP',
    produktname: 'EliteBook 840',
    verkaufspreis: 350,
    zustand: 'gut',
  }

  it('accepts valid bulk save request', () => {
    const result = bulkSaveRequestSchema.safeParse({
      products: [validProduct],
      action: 'erfassen',
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty products array', () => {
    const result = bulkSaveRequestSchema.safeParse({
      products: [],
      action: 'draft',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid action', () => {
    const result = bulkSaveRequestSchema.safeParse({
      products: [validProduct],
      action: 'submit',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing action', () => {
    const result = bulkSaveRequestSchema.safeParse({
      products: [validProduct],
    })
    expect(result.success).toBe(false)
  })

  it('rejects a product with invalid data within the array', () => {
    const result = bulkSaveRequestSchema.safeParse({
      products: [{ ...validProduct, verkaufspreis: -10 }],
      action: 'erfassen',
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// ErfassungRefineSchema
// ============================================================================

describe('ErfassungRefineSchema', () => {
  it('accepts valid refine request', () => {
    const result = ErfassungRefineSchema.safeParse({
      currentProduct: { hersteller: 'HP', produktname: 'EliteBook' },
      instruction: 'Füge die RAM-Spezifikation hinzu.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty currentProduct', () => {
    const result = ErfassungRefineSchema.safeParse({
      currentProduct: {},
      instruction: 'Add RAM spec.',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty instruction', () => {
    const result = ErfassungRefineSchema.safeParse({
      currentProduct: { hersteller: 'HP' },
      instruction: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects instruction longer than 2000 characters', () => {
    const result = ErfassungRefineSchema.safeParse({
      currentProduct: { hersteller: 'HP' },
      instruction: 'x'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// ErfassungTextSchema
// ============================================================================

describe('ErfassungTextSchema', () => {
  it('accepts text with 3+ characters', () => {
    const result = ErfassungTextSchema.safeParse({ text: 'HP EliteBook 840 G8, 16GB RAM' })
    expect(result.success).toBe(true)
  })

  it('rejects text shorter than 3 characters', () => {
    const result = ErfassungTextSchema.safeParse({ text: 'HP' })
    expect(result.success).toBe(false)
  })

  it('accepts text of exactly 3 characters', () => {
    const result = ErfassungTextSchema.safeParse({ text: 'HP ' })
    expect(result.success).toBe(true)
  })

  it('rejects missing text', () => {
    const result = ErfassungTextSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
