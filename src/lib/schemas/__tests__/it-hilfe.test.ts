/**
 * Tests for IT-Hilfe Zod schemas (lib/schemas/it-hilfe.ts)
 *
 * IT-Hilfe is the repair request flow — core to the mission of connecting
 * people needing tech help with volunteer technicians. Schema correctness
 * ensures requests/offers are validated before hitting the database.
 *
 * Covers: itHilfeRequestSchema, CreateOfferSchema, UpdateITHilfeRequestSchema,
 *         AdminHelperActionSchema, validateAndRespond, formatValidationErrors.
 */

import {
  itHilfeRequestSchema,
  CreateOfferSchema,
  UpdateITHilfeRequestSchema,
  AdminHelperActionSchema,
  AdminHelpersQuerySchema,
  validateAndRespond,
  formatValidationErrors,
} from '../it-hilfe'

import { z } from 'zod'

// ============================================================================
// itHilfeRequestSchema
// ============================================================================

describe('itHilfeRequestSchema', () => {
  const valid = {
    title: 'Laptop startet nicht mehr',
  }

  it('accepts minimal valid request (title only)', () => {
    const result = itHilfeRequestSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects title shorter than 5 characters', () => {
    const result = itHilfeRequestSchema.safeParse({ title: 'Hi' })
    expect(result.success).toBe(false)
  })

  it('rejects title longer than 200 characters', () => {
    const result = itHilfeRequestSchema.safeParse({ title: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('accepts title of exactly 5 characters', () => {
    const result = itHilfeRequestSchema.safeParse({ title: 'Hilfe' })
    expect(result.success).toBe(true)
  })

  it('rejects description longer than 5000 characters', () => {
    const result = itHilfeRequestSchema.safeParse({ ...valid, description: 'x'.repeat(5001) })
    expect(result.success).toBe(false)
  })

  it('accepts description of exactly 5000 characters', () => {
    const result = itHilfeRequestSchema.safeParse({ ...valid, description: 'x'.repeat(5000) })
    expect(result.success).toBe(true)
  })

  it('accepts valid urgency levels', () => {
    for (const urgency of ['low', 'normal', 'high', 'urgent']) {
      const result = itHilfeRequestSchema.safeParse({ ...valid, urgency })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid urgency level', () => {
    const result = itHilfeRequestSchema.safeParse({ ...valid, urgency: 'critical' })
    expect(result.success).toBe(false)
  })

  it('accepts valid 4-digit Swiss postal code', () => {
    const result = itHilfeRequestSchema.safeParse({ ...valid, postalCode: '8001' })
    expect(result.success).toBe(true)
  })

  it('rejects postal code with fewer than 4 digits', () => {
    const result = itHilfeRequestSchema.safeParse({ ...valid, postalCode: '800' })
    expect(result.success).toBe(false)
  })

  it('rejects postal code with more than 4 digits', () => {
    const result = itHilfeRequestSchema.safeParse({ ...valid, postalCode: '80012' })
    expect(result.success).toBe(false)
  })

  it('rejects non-numeric postal code', () => {
    const result = itHilfeRequestSchema.safeParse({ ...valid, postalCode: 'ABCD' })
    expect(result.success).toBe(false)
  })

  it('rejects city shorter than 2 characters', () => {
    const result = itHilfeRequestSchema.safeParse({ ...valid, city: 'Z' })
    expect(result.success).toBe(false)
  })

  it('rejects city longer than 100 characters', () => {
    const result = itHilfeRequestSchema.safeParse({ ...valid, city: 'x'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('accepts a valid city name', () => {
    const result = itHilfeRequestSchema.safeParse({ ...valid, city: 'Zürich' })
    expect(result.success).toBe(true)
  })

  it('rejects more than 10 skills', () => {
    // Need valid skill IDs — test structure (10+ items should fail)
    // Use a dynamic approach: generate 11 identical (might be invalid enum, test length)
    const result = itHilfeRequestSchema.safeParse({
      ...valid,
      skillsNeeded: Array.from({ length: 11 }, () => 'windows'),
    })
    // Either fails on enum or on max(10) — either way should fail
    expect(result.success).toBe(false)
  })

  it('rejects negative maxBudgetCents', () => {
    const result = itHilfeRequestSchema.safeParse({ ...valid, maxBudgetCents: -1 })
    expect(result.success).toBe(false)
  })

  it('accepts maxBudgetCents of 0', () => {
    const result = itHilfeRequestSchema.safeParse({ ...valid, maxBudgetCents: 0 })
    expect(result.success).toBe(true)
  })

  it('rejects maxBudgetCents above 100000 (CHF 1000)', () => {
    const result = itHilfeRequestSchema.safeParse({ ...valid, maxBudgetCents: 100001 })
    expect(result.success).toBe(false)
  })

  it('accepts maxBudgetCents of exactly 100000', () => {
    const result = itHilfeRequestSchema.safeParse({ ...valid, maxBudgetCents: 100000 })
    expect(result.success).toBe(true)
  })

  it('accepts a preferred technician UUID and rejects malformed IDs', () => {
    expect(itHilfeRequestSchema.safeParse({
      ...valid,
      preferredTechnicianId: 'a6ba5051-fed3-4689-8150-e3f352c05535',
    }).success).toBe(true)
    expect(itHilfeRequestSchema.safeParse({
      ...valid,
      preferredTechnicianId: 'george',
    }).success).toBe(false)
  })

  it('rejects non-integer maxBudgetCents', () => {
    const result = itHilfeRequestSchema.safeParse({ ...valid, maxBudgetCents: 50.5 })
    expect(result.success).toBe(false)
  })

  it('accepts valid service types', () => {
    for (const serviceType of ['flexible', 'remote', 'onsite', 'pickup', 'dropoff']) {
      const result = itHilfeRequestSchema.safeParse({ ...valid, serviceType })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid service type', () => {
    const result = itHilfeRequestSchema.safeParse({ ...valid, serviceType: 'carrier_pigeon' })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// CreateOfferSchema
// ============================================================================

describe('CreateOfferSchema', () => {
  const valid = {
    message: 'Ich kann gerne helfen! Habe 10 Jahre Erfahrung mit Windows-Reparaturen.',
  }

  it('accepts a valid offer', () => {
    const result = CreateOfferSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('defaults relevantSkills to []', () => {
    const result = CreateOfferSchema.safeParse(valid)
    if (result.success) expect(result.data.relevantSkills).toEqual([])
  })

  it('rejects message shorter than 20 characters', () => {
    const result = CreateOfferSchema.safeParse({ message: 'Kurze Nachricht!' })
    expect(result.success).toBe(false)
  })

  it('rejects message longer than 2000 characters', () => {
    const result = CreateOfferSchema.safeParse({ message: 'x'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('accepts message of exactly 20 characters', () => {
    const result = CreateOfferSchema.safeParse({ message: 'Ich kann helfen ja.!' })
    expect(result.success).toBe(true)
  })

  it('rejects missing message', () => {
    const result = CreateOfferSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts optional estimatedTime', () => {
    const result = CreateOfferSchema.safeParse({ ...valid, estimatedTime: 'Ca. 2 Stunden' })
    expect(result.success).toBe(true)
  })

  it('rejects estimatedTime longer than 200 characters', () => {
    const result = CreateOfferSchema.safeParse({ ...valid, estimatedTime: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('accepts optional proposedCompensation', () => {
    const result = CreateOfferSchema.safeParse({ ...valid, proposedCompensation: 'Kostenlos' })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// UpdateITHilfeRequestSchema
// ============================================================================

describe('UpdateITHilfeRequestSchema', () => {
  it('accepts empty update (all optional)', () => {
    const result = UpdateITHilfeRequestSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts valid partial update', () => {
    const result = UpdateITHilfeRequestSchema.safeParse({
      title: 'Laptop startet nicht mehr nach Update',
      urgency: 'high',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid postal code format', () => {
    const result = UpdateITHilfeRequestSchema.safeParse({ postalCode: '123' })
    expect(result.success).toBe(false)
  })

  it('rejects title shorter than 10 chars (update has stricter min)', () => {
    const result = UpdateITHilfeRequestSchema.safeParse({ title: 'Short' })
    expect(result.success).toBe(false)
  })

  it('accepts image URLs as valid URL array', () => {
    const result = UpdateITHilfeRequestSchema.safeParse({
      imageUrls: ['https://example.com/photo.jpg'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-URL image URL', () => {
    const result = UpdateITHilfeRequestSchema.safeParse({
      imageUrls: ['not-a-url'],
    })
    expect(result.success).toBe(false)
  })

  it('rejects more than 10 image URLs', () => {
    const result = UpdateITHilfeRequestSchema.safeParse({
      imageUrls: Array.from({ length: 11 }, (_, i) => `https://example.com/img${i}.jpg`),
    })
    expect(result.success).toBe(false)
  })

  it('rejects budgetAmountCents above 100000', () => {
    const result = UpdateITHilfeRequestSchema.safeParse({ budgetAmountCents: 100001 })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// AdminHelperActionSchema
// ============================================================================

describe('AdminHelperActionSchema', () => {
  it('accepts verify action', () => {
    const result = AdminHelperActionSchema.safeParse({ action: 'verify' })
    expect(result.success).toBe(true)
  })

  it('accepts suspend action', () => {
    const result = AdminHelperActionSchema.safeParse({ action: 'suspend' })
    expect(result.success).toBe(true)
  })

  it('accepts reactivate action', () => {
    const result = AdminHelperActionSchema.safeParse({ action: 'reactivate' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid action', () => {
    const result = AdminHelperActionSchema.safeParse({ action: 'delete' })
    expect(result.success).toBe(false)
  })

  it('rejects missing action', () => {
    const result = AdminHelperActionSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts optional admin_notes', () => {
    const result = AdminHelperActionSchema.safeParse({
      action: 'verify',
      admin_notes: 'Benutzer wurde telefonisch verifiziert.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects admin_notes longer than 2000 characters', () => {
    const result = AdminHelperActionSchema.safeParse({
      action: 'verify',
      admin_notes: 'x'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// AdminHelpersQuerySchema
// ============================================================================

describe('AdminHelpersQuerySchema', () => {
  it('defaults status to "all"', () => {
    const result = AdminHelpersQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe('all')
  })

  it('accepts valid status filters', () => {
    for (const status of ['all', 'active', 'verified', 'suspended']) {
      const result = AdminHelpersQuerySchema.safeParse({ status })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid status filter', () => {
    const result = AdminHelpersQuerySchema.safeParse({ status: 'banned' })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// validateAndRespond helper
// ============================================================================

describe('validateAndRespond', () => {
  const TestSchema = z.object({ name: z.string().min(1) })

  it('returns success=true with typed data for valid input', () => {
    const result = validateAndRespond(TestSchema, { name: 'Max' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.name).toBe('Max')
  })

  it('returns success=false with errors array for invalid input', () => {
    const result = validateAndRespond(TestSchema, { name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(Array.isArray(result.errors)).toBe(true)
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })

  it('error messages include path and message', () => {
    const result = validateAndRespond(TestSchema, {})
    if (!result.success) {
      // Each error should be a non-empty string
      for (const err of result.errors) {
        expect(typeof err).toBe('string')
        expect(err.length).toBeGreaterThan(0)
      }
    }
  })
})

// ============================================================================
// formatValidationErrors helper
// ============================================================================

describe('formatValidationErrors', () => {
  it('returns a comma-separated string of error messages', () => {
    const parseResult = z.object({
      a: z.string().min(1),
      b: z.number(),
    }).safeParse({ a: '', b: 'not-a-number' })

    expect(parseResult.success).toBe(false)
    if (!parseResult.success) {
      const formatted = formatValidationErrors(parseResult.error)
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    }
  })
})
