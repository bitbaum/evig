/**
 * Tests for donation Zod schemas (lib/schemas/donations.ts)
 *
 * Donations are a primary funding source for Revamp-IT's mission.
 * Both monetary and device donations have distinct validation paths.
 * Schema correctness ensures donation records are well-formed before DB writes.
 *
 * Covers: CreateMonetaryDonationSchema, CreateDeviceDonationSchema,
 *         CreateDonationSchema (discriminated union), UpdateDonationSchema,
 *         GetDonationsQuerySchema.
 */

import {
  CreateMonetaryDonationSchema,
  CreateDeviceDonationSchema,
  CreateDonationSchema,
  UpdateDonationSchema,
  GetDonationsQuerySchema,
} from '../donations'

import {
  DONATION_TYPES,
  DEVICE_CATEGORIES,
  DEVICE_CONDITIONS,
  PAYMENT_METHODS,
  DONATION_STATUSES,
} from '@/config/donations'

// ============================================================================
// CreateMonetaryDonationSchema
// ============================================================================

describe('CreateMonetaryDonationSchema', () => {
  const valid = {
    donation_type: DONATION_TYPES.MONETARY,
    amount_cents: 1000,
  }

  it('accepts a minimal valid monetary donation', () => {
    const result = CreateMonetaryDonationSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('defaults currency to CHF', () => {
    const result = CreateMonetaryDonationSchema.safeParse(valid)
    if (result.success) expect(result.data.currency).toBe('CHF')
  })

  it('defaults is_recurring to false', () => {
    const result = CreateMonetaryDonationSchema.safeParse(valid)
    if (result.success) expect(result.data.is_recurring).toBe(false)
  })

  it('defaults receipt_requested to false', () => {
    const result = CreateMonetaryDonationSchema.safeParse(valid)
    if (result.success) expect(result.data.receipt_requested).toBe(false)
  })

  it('rejects amount_cents below 100 (CHF 1.00 minimum)', () => {
    const result = CreateMonetaryDonationSchema.safeParse({ ...valid, amount_cents: 99 })
    expect(result.success).toBe(false)
  })

  it('accepts amount_cents of exactly 100', () => {
    const result = CreateMonetaryDonationSchema.safeParse({ ...valid, amount_cents: 100 })
    expect(result.success).toBe(true)
  })

  it('rejects non-integer amount_cents', () => {
    const result = CreateMonetaryDonationSchema.safeParse({ ...valid, amount_cents: 10.50 })
    expect(result.success).toBe(false)
  })

  it('accepts all valid payment methods', () => {
    for (const payment_method of Object.values(PAYMENT_METHODS)) {
      const result = CreateMonetaryDonationSchema.safeParse({ ...valid, payment_method })
      expect(result.success).toBe(true)
    }
  })

  it('accepts all valid recurring frequencies', () => {
    for (const recurring_frequency of ['monthly', 'quarterly', 'yearly']) {
      const result = CreateMonetaryDonationSchema.safeParse({ ...valid, recurring_frequency })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid recurring frequency', () => {
    const result = CreateMonetaryDonationSchema.safeParse({ ...valid, recurring_frequency: 'daily' })
    expect(result.success).toBe(false)
  })

  it('accepts valid UUID user_id', () => {
    const result = CreateMonetaryDonationSchema.safeParse({
      ...valid,
      user_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-UUID user_id', () => {
    const result = CreateMonetaryDonationSchema.safeParse({ ...valid, user_id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('accepts valid email for donor_email', () => {
    const result = CreateMonetaryDonationSchema.safeParse({
      ...valid,
      donor_email: 'spender@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid donor_email', () => {
    const result = CreateMonetaryDonationSchema.safeParse({ ...valid, donor_email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('rejects notes longer than 2000 characters', () => {
    const result = CreateMonetaryDonationSchema.safeParse({ ...valid, notes: 'x'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('accepts receipt_requested as true', () => {
    const result = CreateMonetaryDonationSchema.safeParse({ ...valid, receipt_requested: true })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// CreateDeviceDonationSchema
// ============================================================================

describe('CreateDeviceDonationSchema', () => {
  const valid = {
    donation_type: DONATION_TYPES.DEVICE,
    device_category: DEVICE_CATEGORIES.LAPTOP,
  }

  it('accepts a minimal valid device donation', () => {
    const result = CreateDeviceDonationSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts all valid device categories', () => {
    for (const device_category of Object.values(DEVICE_CATEGORIES)) {
      const result = CreateDeviceDonationSchema.safeParse({ ...valid, device_category })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid device category', () => {
    const result = CreateDeviceDonationSchema.safeParse({ ...valid, device_category: 'bicycle' })
    expect(result.success).toBe(false)
  })

  it('rejects missing device_category', () => {
    const { device_category, ...rest } = valid
    const result = CreateDeviceDonationSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('accepts all valid device conditions', () => {
    for (const device_condition of Object.values(DEVICE_CONDITIONS)) {
      const result = CreateDeviceDonationSchema.safeParse({ ...valid, device_condition })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid device condition', () => {
    const result = CreateDeviceDonationSchema.safeParse({ ...valid, device_condition: 'pristine' })
    expect(result.success).toBe(false)
  })

  it('rejects device_age_years below 0', () => {
    const result = CreateDeviceDonationSchema.safeParse({ ...valid, device_age_years: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects device_age_years above 50', () => {
    const result = CreateDeviceDonationSchema.safeParse({ ...valid, device_age_years: 51 })
    expect(result.success).toBe(false)
  })

  it('accepts device_age_years of 0 and 50', () => {
    for (const device_age_years of [0, 50]) {
      const result = CreateDeviceDonationSchema.safeParse({ ...valid, device_age_years })
      expect(result.success).toBe(true)
    }
  })

  it('rejects non-integer device_age_years', () => {
    const result = CreateDeviceDonationSchema.safeParse({ ...valid, device_age_years: 2.5 })
    expect(result.success).toBe(false)
  })

  it('rejects estimated_value_cents below 0', () => {
    const result = CreateDeviceDonationSchema.safeParse({ ...valid, estimated_value_cents: -1 })
    expect(result.success).toBe(false)
  })

  it('accepts estimated_value_cents of 0', () => {
    const result = CreateDeviceDonationSchema.safeParse({ ...valid, estimated_value_cents: 0 })
    expect(result.success).toBe(true)
  })

  it('rejects device_description longer than 2000 characters', () => {
    const result = CreateDeviceDonationSchema.safeParse({
      ...valid,
      device_description: 'x'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// CreateDonationSchema (discriminated union)
// ============================================================================

describe('CreateDonationSchema (discriminated union)', () => {
  it('routes monetary donation to monetary schema', () => {
    const result = CreateDonationSchema.safeParse({
      donation_type: DONATION_TYPES.MONETARY,
      amount_cents: 5000,
    })
    expect(result.success).toBe(true)
  })

  it('routes device donation to device schema', () => {
    const result = CreateDonationSchema.safeParse({
      donation_type: DONATION_TYPES.DEVICE,
      device_category: DEVICE_CATEGORIES.DESKTOP,
    })
    expect(result.success).toBe(true)
  })

  it('rejects unknown donation_type', () => {
    const result = CreateDonationSchema.safeParse({
      donation_type: 'service',
      amount_cents: 1000,
    })
    expect(result.success).toBe(false)
  })

  it('rejects monetary donation without amount_cents', () => {
    const result = CreateDonationSchema.safeParse({
      donation_type: DONATION_TYPES.MONETARY,
    })
    expect(result.success).toBe(false)
  })

  it('rejects device donation without device_category', () => {
    const result = CreateDonationSchema.safeParse({
      donation_type: DONATION_TYPES.DEVICE,
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// UpdateDonationSchema
// ============================================================================

describe('UpdateDonationSchema', () => {
  it('accepts empty update (all optional)', () => {
    const result = UpdateDonationSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts valid status update', () => {
    for (const status of Object.values(DONATION_STATUSES)) {
      const result = UpdateDonationSchema.safeParse({ status })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid status', () => {
    const result = UpdateDonationSchema.safeParse({ status: 'deleted' })
    expect(result.success).toBe(false)
  })

  it('accepts boolean thank_you_sent', () => {
    const result = UpdateDonationSchema.safeParse({ thank_you_sent: true })
    expect(result.success).toBe(true)
  })

  it('accepts boolean receipt_sent', () => {
    const result = UpdateDonationSchema.safeParse({ receipt_sent: true })
    expect(result.success).toBe(true)
  })

  it('rejects notes longer than 2000 characters', () => {
    const result = UpdateDonationSchema.safeParse({ notes: 'x'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('rejects estimated_value_cents below 0', () => {
    const result = UpdateDonationSchema.safeParse({ estimated_value_cents: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects non-UUID user_id', () => {
    const result = UpdateDonationSchema.safeParse({ user_id: 'not-uuid' })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// GetDonationsQuerySchema
// ============================================================================

describe('GetDonationsQuerySchema', () => {
  it('accepts empty query (all defaults)', () => {
    const result = GetDonationsQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('defaults limit to 20', () => {
    const result = GetDonationsQuerySchema.safeParse({})
    if (result.success) expect(result.data.limit).toBe(20)
  })

  it('defaults offset to 0', () => {
    const result = GetDonationsQuerySchema.safeParse({})
    if (result.success) expect(result.data.offset).toBe(0)
  })

  it('defaults sort_by to created_at', () => {
    const result = GetDonationsQuerySchema.safeParse({})
    if (result.success) expect(result.data.sort_by).toBe('created_at')
  })

  it('defaults sort_order to desc', () => {
    const result = GetDonationsQuerySchema.safeParse({})
    if (result.success) expect(result.data.sort_order).toBe('desc')
  })

  it('accepts valid donation_type filter', () => {
    for (const donation_type of Object.values(DONATION_TYPES)) {
      const result = GetDonationsQuerySchema.safeParse({ donation_type })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid donation_type filter', () => {
    const result = GetDonationsQuerySchema.safeParse({ donation_type: 'time' })
    expect(result.success).toBe(false)
  })

  it('accepts valid status filter', () => {
    for (const status of Object.values(DONATION_STATUSES)) {
      const result = GetDonationsQuerySchema.safeParse({ status })
      expect(result.success).toBe(true)
    }
  })

  it('rejects limit above 100', () => {
    const result = GetDonationsQuerySchema.safeParse({ limit: 101 })
    expect(result.success).toBe(false)
  })

  it('rejects limit below 1', () => {
    const result = GetDonationsQuerySchema.safeParse({ limit: 0 })
    expect(result.success).toBe(false)
  })

  it('coerces string limit to number', () => {
    const result = GetDonationsQuerySchema.safeParse({ limit: '50' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.limit).toBe(50)
  })

  it('accepts valid sort_by values', () => {
    for (const sort_by of ['created_at', 'amount_cents', 'status']) {
      const result = GetDonationsQuerySchema.safeParse({ sort_by })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid sort_by', () => {
    const result = GetDonationsQuerySchema.safeParse({ sort_by: 'name' })
    expect(result.success).toBe(false)
  })

  it('accepts sort_order asc and desc', () => {
    for (const sort_order of ['asc', 'desc']) {
      const result = GetDonationsQuerySchema.safeParse({ sort_order })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid sort_order', () => {
    const result = GetDonationsQuerySchema.safeParse({ sort_order: 'random' })
    expect(result.success).toBe(false)
  })
})
