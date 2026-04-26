/**
 * Tests for payment Zod schemas (lib/schemas/payments.ts).
 *
 * Money-handling schemas — bugs here let malformed payment intents,
 * refunds, escrow releases, or invoice updates reach the DB or the
 * Payrexx integration. Each schema must clearly distinguish required
 * from optional fields and enforce positive amounts where money flows.
 */

import {
  CreatePaymentIntentSchema,
  RefundSchema,
  EscrowReleaseSchema,
  UpdateInvoiceSchema,
  RefundActionSchema,
} from '../payments'

const UUID = '00000000-0000-4000-8000-000000000000'

// ============================================================================
// CreatePaymentIntentSchema
// ============================================================================

describe('CreatePaymentIntentSchema', () => {
  const valid = { amount: 1500 }

  it('accepts a minimal payment intent and applies all defaults', () => {
    const result = CreatePaymentIntentSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.amount).toBe(1500)
    expect(result.data.currency).toBe('CHF')
    expect(result.data.escrowEnabled).toBe(false)
    expect(result.data.autoReleaseDays).toBe(7)
    expect(result.data.includeVAT).toBe(true)
    expect(result.data.businessType).toBe('service')
  })

  it('rejects a zero amount', () => {
    const result = CreatePaymentIntentSchema.safeParse({ amount: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects a negative amount', () => {
    const result = CreatePaymentIntentSchema.safeParse({ amount: -10 })
    expect(result.success).toBe(false)
  })

  it('accepts EUR currency', () => {
    const result = CreatePaymentIntentSchema.safeParse({ amount: 1500, currency: 'EUR' })
    expect(result.success).toBe(true)
  })

  it('rejects an unsupported currency', () => {
    const result = CreatePaymentIntentSchema.safeParse({ amount: 1500, currency: 'USD' })
    expect(result.success).toBe(false)
  })

  it('clamps autoReleaseDays to [1, 90]', () => {
    expect(CreatePaymentIntentSchema.safeParse({ amount: 100, autoReleaseDays: 0 }).success).toBe(false)
    expect(CreatePaymentIntentSchema.safeParse({ amount: 100, autoReleaseDays: 91 }).success).toBe(false)
    expect(CreatePaymentIntentSchema.safeParse({ amount: 100, autoReleaseDays: 1 }).success).toBe(true)
    expect(CreatePaymentIntentSchema.safeParse({ amount: 100, autoReleaseDays: 90 }).success).toBe(true)
  })

  it('rejects fractional autoReleaseDays (must be integer)', () => {
    const result = CreatePaymentIntentSchema.safeParse({ amount: 100, autoReleaseDays: 7.5 })
    expect(result.success).toBe(false)
  })

  it('accepts the three optional UUIDs as null', () => {
    const result = CreatePaymentIntentSchema.safeParse({
      amount: 100,
      orderId: null,
      serviceAppointmentId: null,
      workshopRegistrationId: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a non-UUID orderId', () => {
    const result = CreatePaymentIntentSchema.safeParse({ amount: 100, orderId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('accepts a valid UUID for the linked entity ids', () => {
    const result = CreatePaymentIntentSchema.safeParse({ amount: 100, orderId: UUID })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// RefundSchema
// ============================================================================

describe('RefundSchema', () => {
  const valid = { transactionId: UUID, amount: 500, reason: 'Duplicate charge' }

  it('accepts a valid refund', () => {
    const result = RefundSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('requires a non-empty reason', () => {
    const result = RefundSchema.safeParse({ ...valid, reason: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a non-positive amount', () => {
    expect(RefundSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false)
    expect(RefundSchema.safeParse({ ...valid, amount: -1 }).success).toBe(false)
  })

  it('requires a UUID transactionId', () => {
    const result = RefundSchema.safeParse({ ...valid, transactionId: 'abc' })
    expect(result.success).toBe(false)
  })

  it('accepts optional details fields as null', () => {
    const result = RefundSchema.safeParse({ ...valid, reasonDetails: null, customerNotes: null })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// EscrowReleaseSchema
// ============================================================================

describe('EscrowReleaseSchema', () => {
  it('accepts a valid full release with default releaseType', () => {
    const result = EscrowReleaseSchema.safeParse({ amount: 1000 })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.releaseType).toBe('full')
  })

  it('accepts a partial release', () => {
    const result = EscrowReleaseSchema.safeParse({ amount: 500, releaseType: 'partial' })
    expect(result.success).toBe(true)
  })

  it('rejects an unsupported releaseType', () => {
    const result = EscrowReleaseSchema.safeParse({ amount: 500, releaseType: 'maybe' })
    expect(result.success).toBe(false)
  })

  it('rejects a non-positive amount', () => {
    expect(EscrowReleaseSchema.safeParse({ amount: 0 }).success).toBe(false)
    expect(EscrowReleaseSchema.safeParse({ amount: -100 }).success).toBe(false)
  })
})

// ============================================================================
// UpdateInvoiceSchema
// ============================================================================

describe('UpdateInvoiceSchema', () => {
  it('accepts an empty patch (all fields optional)', () => {
    const result = UpdateInvoiceSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts arbitrary address records', () => {
    const result = UpdateInvoiceSchema.safeParse({
      billing_address: { city: 'Zürich', postal: '8004' },
    })
    expect(result.success).toBe(true)
  })

  it('caps notes at 5000 characters', () => {
    expect(UpdateInvoiceSchema.safeParse({ notes: 'x'.repeat(5000) }).success).toBe(true)
    expect(UpdateInvoiceSchema.safeParse({ notes: 'x'.repeat(5001) }).success).toBe(false)
  })

  it('caps payment_terms at 500 characters', () => {
    expect(UpdateInvoiceSchema.safeParse({ payment_terms: 'x'.repeat(501) }).success).toBe(false)
  })

  it('accepts arbitrary line item objects', () => {
    const result = UpdateInvoiceSchema.safeParse({
      line_items: [{ description: 'Service', quantity: 2, price: 50 }],
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// RefundActionSchema
// ============================================================================

describe('RefundActionSchema', () => {
  it('accepts approve / reject / process actions', () => {
    expect(RefundActionSchema.safeParse({ action: 'approve' }).success).toBe(true)
    expect(RefundActionSchema.safeParse({ action: 'reject' }).success).toBe(true)
    expect(RefundActionSchema.safeParse({ action: 'process' }).success).toBe(true)
  })

  it('rejects an unknown action', () => {
    const result = RefundActionSchema.safeParse({ action: 'cancel' })
    expect(result.success).toBe(false)
  })

  it('caps notes at 2000 characters', () => {
    expect(RefundActionSchema.safeParse({ action: 'approve', notes: 'x'.repeat(2001) }).success).toBe(false)
  })
})
