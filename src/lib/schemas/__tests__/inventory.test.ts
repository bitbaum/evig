/**
 * Tests for inventory Zod schemas (lib/schemas/inventory.ts)
 *
 * Inventory schemas control how products are updated after erfassung and
 * how CSV imports are validated before ingestion. Correctness ensures
 * stock data stays clean throughout the pipeline.
 *
 * Covers: ImportCSVSchema, InventoryUpdateSchema, InventoryPatchSchema.
 */

import {
  ImportCSVSchema,
  InventoryUpdateSchema,
  InventoryPatchSchema,
} from '../inventory'

import { FILE_SIZE_LIMITS } from '@/config/limits'

// ============================================================================
// ImportCSVSchema
// ============================================================================

describe('ImportCSVSchema', () => {
  const minimalCsv = 'name,price\nThinkPad,350'

  it('accepts valid CSV content', () => {
    const result = ImportCSVSchema.safeParse({ csvContent: minimalCsv })
    expect(result.success).toBe(true)
  })

  it('defaults options to empty object', () => {
    const result = ImportCSVSchema.safeParse({ csvContent: minimalCsv })
    if (result.success) expect(result.data.options).toEqual({})
  })

  it('rejects empty csvContent', () => {
    const result = ImportCSVSchema.safeParse({ csvContent: '' })
    expect(result.success).toBe(false)
  })

  it('rejects csvContent exceeding 5MB', () => {
    // CSV_MAX is 5 * 1024 * 1024 bytes — generate a string one byte over
    const result = ImportCSVSchema.safeParse({ csvContent: 'x'.repeat(FILE_SIZE_LIMITS.CSV_MAX + 1) })
    expect(result.success).toBe(false)
  })

  it('accepts csvContent of exactly CSV_MAX size', () => {
    const result = ImportCSVSchema.safeParse({ csvContent: 'x'.repeat(FILE_SIZE_LIMITS.CSV_MAX) })
    expect(result.success).toBe(true)
  })

  it('accepts options record', () => {
    const result = ImportCSVSchema.safeParse({
      csvContent: minimalCsv,
      options: { delimiter: ';', skipHeader: true },
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// InventoryUpdateSchema
// ============================================================================

describe('InventoryUpdateSchema', () => {
  it('accepts empty update (all optional)', () => {
    const result = InventoryUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts valid partial update', () => {
    const result = InventoryUpdateSchema.safeParse({
      product_name: 'ThinkPad X1 Carbon Gen 9',
      condition: 'gut',
      estimated_price_chf: 450,
    })
    expect(result.success).toBe(true)
  })

  it('rejects product_name longer than 500 characters', () => {
    const result = InventoryUpdateSchema.safeParse({ product_name: 'x'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('rejects brand longer than 200 characters', () => {
    const result = InventoryUpdateSchema.safeParse({ brand: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('rejects short_description longer than 5000 characters', () => {
    const result = InventoryUpdateSchema.safeParse({ short_description: 'x'.repeat(5001) })
    expect(result.success).toBe(false)
  })

  it('rejects negative estimated_price_chf', () => {
    const result = InventoryUpdateSchema.safeParse({ estimated_price_chf: -1 })
    expect(result.success).toBe(false)
  })

  it('accepts estimated_price_chf of 0', () => {
    const result = InventoryUpdateSchema.safeParse({ estimated_price_chf: 0 })
    expect(result.success).toBe(true)
  })

  it('coerces string estimated_price_chf to number', () => {
    const result = InventoryUpdateSchema.safeParse({ estimated_price_chf: '299' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.estimated_price_chf).toBe(299)
  })

  it('rejects negative weight_grams', () => {
    const result = InventoryUpdateSchema.safeParse({ weight_grams: -1 })
    expect(result.success).toBe(false)
  })

  it('accepts weight_grams of 0', () => {
    const result = InventoryUpdateSchema.safeParse({ weight_grams: 0 })
    expect(result.success).toBe(true)
  })

  it('rejects negative quantity_available', () => {
    const result = InventoryUpdateSchema.safeParse({ quantity_available: -1 })
    expect(result.success).toBe(false)
  })

  it('accepts quantity_available of 0', () => {
    const result = InventoryUpdateSchema.safeParse({ quantity_available: 0 })
    expect(result.success).toBe(true)
  })

  it('rejects non-integer quantity_available', () => {
    const result = InventoryUpdateSchema.safeParse({ quantity_available: 2.5 })
    expect(result.success).toBe(false)
  })

  it('accepts specifications record', () => {
    const result = InventoryUpdateSchema.safeParse({
      specifications: { RAM: '16 GB', SSD: '512 GB' },
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// InventoryPatchSchema
// ============================================================================

describe('InventoryPatchSchema', () => {
  it('accepts empty patch (all optional)', () => {
    const result = InventoryPatchSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts marketplace_status "draft"', () => {
    const result = InventoryPatchSchema.safeParse({ marketplace_status: 'draft' })
    expect(result.success).toBe(true)
  })

  it('accepts marketplace_status "published"', () => {
    const result = InventoryPatchSchema.safeParse({ marketplace_status: 'published' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid marketplace_status', () => {
    const result = InventoryPatchSchema.safeParse({ marketplace_status: 'archived' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid status values', () => {
    for (const status of ['pending_review', 'approved', 'rejected']) {
      const result = InventoryPatchSchema.safeParse({ status })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid status', () => {
    const result = InventoryPatchSchema.safeParse({ status: 'active' })
    expect(result.success).toBe(false)
  })
})
