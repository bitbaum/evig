/**
 * Tests for intake Zod schemas (lib/schemas/intake.ts)
 *
 * The intake system is the unified device entry pipeline — hardware received
 * by Revamp-IT gets triaged into refurbish/parts/recycle tiers before going
 * through erfassung. Schema correctness gates what enters the repair pipeline.
 *
 * Covers: IntakeCreateSchema, IntakeUpdateSchema, ChecklistUpdateSchema,
 *         IntakePublishSchema, IntakeQuerySchema.
 */

import {
  IntakeCreateSchema,
  IntakeUpdateSchema,
  ChecklistUpdateSchema,
  IntakePublishSchema,
  IntakeQuerySchema,
} from '../intake'

import { INTAKE_TIERS } from '@/config/intake-checklist'

// ============================================================================
// IntakeCreateSchema
// ============================================================================

describe('IntakeCreateSchema', () => {
  const valid = {
    hersteller: 'Lenovo',
    produktname: 'ThinkPad T480',
    zustand: 'gut',
    intake_tier: INTAKE_TIERS.REFURBISH,
  }

  it('accepts minimal valid intake', () => {
    const result = IntakeCreateSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('defaults is_donation to false', () => {
    const result = IntakeCreateSchema.safeParse(valid)
    if (result.success) expect(result.data.is_donation).toBe(false)
  })

  it('rejects empty hersteller', () => {
    const result = IntakeCreateSchema.safeParse({ ...valid, hersteller: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing hersteller', () => {
    const { hersteller, ...rest } = valid
    const result = IntakeCreateSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects empty produktname', () => {
    const result = IntakeCreateSchema.safeParse({ ...valid, produktname: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty zustand', () => {
    const result = IntakeCreateSchema.safeParse({ ...valid, zustand: '' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid intake tiers', () => {
    for (const intake_tier of Object.values(INTAKE_TIERS)) {
      const result = IntakeCreateSchema.safeParse({ ...valid, intake_tier })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid intake tier', () => {
    const result = IntakeCreateSchema.safeParse({ ...valid, intake_tier: 'landfill' })
    expect(result.success).toBe(false)
  })

  it('rejects missing intake_tier', () => {
    const { intake_tier, ...rest } = valid
    const result = IntakeCreateSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects negative verkaufspreis', () => {
    const result = IntakeCreateSchema.safeParse({ ...valid, verkaufspreis: -1 })
    expect(result.success).toBe(false)
  })

  it('accepts verkaufspreis of 0', () => {
    const result = IntakeCreateSchema.safeParse({ ...valid, verkaufspreis: 0 })
    expect(result.success).toBe(true)
  })

  it('accepts donation details', () => {
    const result = IntakeCreateSchema.safeParse({
      ...valid,
      is_donation: true,
      donor_name: 'Max Muster',
      donor_email: 'max@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid donor_email', () => {
    const result = IntakeCreateSchema.safeParse({ ...valid, donor_email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('accepts empty string donor_email (optional field)', () => {
    const result = IntakeCreateSchema.safeParse({ ...valid, donor_email: '' })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// IntakeUpdateSchema
// ============================================================================

describe('IntakeUpdateSchema', () => {
  it('accepts empty update (all optional)', () => {
    const result = IntakeUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts partial update with one field', () => {
    const result = IntakeUpdateSchema.safeParse({ zustand: 'neuwertig' })
    expect(result.success).toBe(true)
  })

  it('rejects empty hersteller if provided', () => {
    const result = IntakeUpdateSchema.safeParse({ hersteller: '' })
    expect(result.success).toBe(false)
  })

  it('accepts valid intake_tier update', () => {
    const result = IntakeUpdateSchema.safeParse({ intake_tier: INTAKE_TIERS.PARTS })
    expect(result.success).toBe(true)
  })

  it('rejects invalid intake_tier if provided', () => {
    const result = IntakeUpdateSchema.safeParse({ intake_tier: 'scrap' })
    expect(result.success).toBe(false)
  })

  it('rejects negative verkaufspreis if provided', () => {
    const result = IntakeUpdateSchema.safeParse({ verkaufspreis: -5 })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// ChecklistUpdateSchema
// ============================================================================

describe('ChecklistUpdateSchema', () => {
  it('accepts a pass verdict', () => {
    const result = ChecklistUpdateSchema.safeParse({
      item_id: 'check-battery',
      result: 'pass',
    })
    expect(result.success).toBe(true)
  })

  it("accepts an 'n.a.' verdict", () => {
    const result = ChecklistUpdateSchema.safeParse({
      item_id: 'check-camera',
      result: 'na',
    })
    expect(result.success).toBe(true)
  })

  it('accepts result: null (reset to open)', () => {
    const result = ChecklistUpdateSchema.safeParse({
      item_id: 'check-keyboard',
      result: null,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a fail verdict WITH notes', () => {
    const result = ChecklistUpdateSchema.safeParse({
      item_id: 'check-battery',
      result: 'fail',
      notes: 'Akku hält nur 20 Minuten',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a fail verdict without notes (reason required)', () => {
    expect(ChecklistUpdateSchema.safeParse({ item_id: 'check-battery', result: 'fail' }).success).toBe(false)
    expect(ChecklistUpdateSchema.safeParse({ item_id: 'check-battery', result: 'fail', notes: '   ' }).success).toBe(false)
  })

  it('rejects unknown verdicts', () => {
    const result = ChecklistUpdateSchema.safeParse({ item_id: 'check-screen', result: 'maybe' })
    expect(result.success).toBe(false)
  })

  it('rejects empty item_id', () => {
    const result = ChecklistUpdateSchema.safeParse({ item_id: '', result: 'pass' })
    expect(result.success).toBe(false)
  })

  it('rejects missing item_id', () => {
    const result = ChecklistUpdateSchema.safeParse({ result: 'pass' })
    expect(result.success).toBe(false)
  })

  it('rejects missing result', () => {
    const result = ChecklistUpdateSchema.safeParse({ item_id: 'check-screen' })
    expect(result.success).toBe(false)
  })

  it('defaults notes to empty string', () => {
    const result = ChecklistUpdateSchema.safeParse({ item_id: 'check-screen', result: 'pass' })
    if (result.success) expect(result.data.notes).toBe('')
  })

  it('requires a reason of at least 10 characters for a second-person override', () => {
    expect(ChecklistUpdateSchema.safeParse({
      item_id: 'final_qa',
      result: 'pass',
      second_person_override: true,
      notes: 'zu kurz',
    }).success).toBe(false)

    expect(ChecklistUpdateSchema.safeParse({
      item_id: 'final_qa',
      result: 'pass',
      second_person_override: true,
      notes: 'allein im Dienst',
    }).success).toBe(true)
  })
})

// ============================================================================
// IntakePublishSchema
// ============================================================================

describe('IntakePublishSchema', () => {
  it('accepts valid publish with price', () => {
    const result = IntakePublishSchema.safeParse({ price_chf: 120 })
    expect(result.success).toBe(true)
  })

  it('accepts price_chf of 0 (free item)', () => {
    const result = IntakePublishSchema.safeParse({ price_chf: 0 })
    expect(result.success).toBe(true)
  })

  it('rejects negative price_chf', () => {
    const result = IntakePublishSchema.safeParse({ price_chf: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects missing price_chf', () => {
    const result = IntakePublishSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts optional title and description', () => {
    const result = IntakePublishSchema.safeParse({
      price_chf: 80,
      title: 'Laptop in gutem Zustand',
      description: 'Inkl. Netzteil.',
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// IntakeQuerySchema
// ============================================================================

describe('IntakeQuerySchema', () => {
  it('accepts empty query (defaults applied)', () => {
    const result = IntakeQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts optional tier filter', () => {
    const result = IntakeQuerySchema.safeParse({ tier: INTAKE_TIERS.RECYCLE })
    expect(result.success).toBe(true)
  })

  it('accepts optional status filter', () => {
    const result = IntakeQuerySchema.safeParse({ status: 'in_progress' })
    expect(result.success).toBe(true)
  })

  it('accepts optional search string', () => {
    const result = IntakeQuerySchema.safeParse({ search: 'ThinkPad' })
    expect(result.success).toBe(true)
  })
})
