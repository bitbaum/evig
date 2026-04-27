/**
 * Tests for appointment Zod schemas (lib/schemas/appointments.ts).
 *
 * Service-appointment lifecycle: create, query, action (state machine
 * via discriminated union), and pay. The home-visit refine and the
 * action discriminator are the main correctness surfaces — both
 * easy to break silently when fields move around.
 */

import {
  CreateAppointmentSchema,
  GetAppointmentsQuerySchema,
  BookWithPaymentSchema,
  AppointmentActionSchema,
  PayAppointmentSchema,
} from '../appointments'

const UUID = '00000000-0000-4000-8000-000000000000'
const ISO_DATE = '2026-06-15T10:00:00.000Z'

// ============================================================================
// CreateAppointmentSchema
// ============================================================================

describe('CreateAppointmentSchema', () => {
  const valid = { description: 'Laptop bootet nicht mehr.' }

  it('accepts a minimal appointment with description only', () => {
    const result = CreateAppointmentSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.urgency).toBe('normal')
    expect(result.data.is_home_visit).toBe(false)
  })

  it('rejects an empty description', () => {
    expect(CreateAppointmentSchema.safeParse({ description: '' }).success).toBe(false)
  })

  it('caps description at 2000 chars', () => {
    expect(CreateAppointmentSchema.safeParse({ description: 'x'.repeat(2001) }).success).toBe(false)
  })

  it('requires visit_address + visit_city when is_home_visit=true', () => {
    const result = CreateAppointmentSchema.safeParse({
      ...valid,
      is_home_visit: true,
      // missing visit_address + visit_city
    })
    expect(result.success).toBe(false)
  })

  it('accepts a home visit with both address fields', () => {
    const result = CreateAppointmentSchema.safeParse({
      ...valid,
      is_home_visit: true,
      visit_address: 'Hardstrasse 245',
      visit_city: 'Zürich',
    })
    expect(result.success).toBe(true)
  })

  it('still rejects a home visit when only one of address/city is set', () => {
    expect(CreateAppointmentSchema.safeParse({
      ...valid,
      is_home_visit: true,
      visit_address: 'Hardstrasse 245',
    }).success).toBe(false)
    expect(CreateAppointmentSchema.safeParse({
      ...valid,
      is_home_visit: true,
      visit_city: 'Zürich',
    }).success).toBe(false)
  })

  it('accepts all four urgency levels', () => {
    for (const u of ['low', 'normal', 'high', 'urgent']) {
      expect(CreateAppointmentSchema.safeParse({ ...valid, urgency: u }).success).toBe(true)
    }
  })

  it('rejects an unknown urgency', () => {
    expect(CreateAppointmentSchema.safeParse({ ...valid, urgency: 'whenever' }).success).toBe(false)
  })

  it('rejects a non-ISO preferred_date', () => {
    expect(CreateAppointmentSchema.safeParse({ ...valid, preferred_date: '2026-06-15' }).success).toBe(false)
  })

  it('accepts ISO datetime with offset for both naming variants', () => {
    expect(CreateAppointmentSchema.safeParse({ ...valid, preferred_date: ISO_DATE }).success).toBe(true)
    expect(CreateAppointmentSchema.safeParse({ ...valid, preferredDate: ISO_DATE }).success).toBe(true)
  })

  it('rejects a non-UUID repairer_id', () => {
    expect(CreateAppointmentSchema.safeParse({ ...valid, repairer_id: 'abc' }).success).toBe(false)
  })
})

// ============================================================================
// GetAppointmentsQuerySchema
// ============================================================================

describe('GetAppointmentsQuerySchema', () => {
  it('applies role + limit defaults', () => {
    const result = GetAppointmentsQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.role).toBeDefined()
    expect(result.data.limit).toBe(50)
  })

  it('caps limit at 100', () => {
    expect(GetAppointmentsQuerySchema.safeParse({ limit: 101 }).success).toBe(false)
  })

  it('coerces string limit to number', () => {
    const result = GetAppointmentsQuerySchema.safeParse({ limit: '25' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.limit).toBe(25)
  })
})

// ============================================================================
// BookWithPaymentSchema
// ============================================================================

describe('BookWithPaymentSchema', () => {
  it('requires serviceSlug', () => {
    expect(BookWithPaymentSchema.safeParse({}).success).toBe(false)
  })

  it('rejects empty serviceSlug', () => {
    expect(BookWithPaymentSchema.safeParse({ serviceSlug: '' }).success).toBe(false)
  })

  it('accepts minimal request and applies defaults', () => {
    const result = BookWithPaymentSchema.safeParse({ serviceSlug: 'laptop-repair' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.urgency).toBe('normal')
    expect(result.data.useEscrow).toBe(true)
  })

  it('clamps autoReleaseDays to [1, 90]', () => {
    expect(BookWithPaymentSchema.safeParse({ serviceSlug: 'x', autoReleaseDays: 0 }).success).toBe(false)
    expect(BookWithPaymentSchema.safeParse({ serviceSlug: 'x', autoReleaseDays: 91 }).success).toBe(false)
    expect(BookWithPaymentSchema.safeParse({ serviceSlug: 'x', autoReleaseDays: 1 }).success).toBe(true)
  })
})

// ============================================================================
// AppointmentActionSchema (discriminated union)
// ============================================================================

describe('AppointmentActionSchema', () => {
  it('accepts each unparametrized action', () => {
    for (const action of ['accept', 'reject', 'approve_quote', 'reject_quote', 'cancel']) {
      expect(AppointmentActionSchema.safeParse({ action }).success).toBe(true)
    }
  })

  it('requires positive quoted_price_chf for quote action', () => {
    expect(AppointmentActionSchema.safeParse({ action: 'quote' }).success).toBe(false)
    expect(AppointmentActionSchema.safeParse({ action: 'quote', quoted_price_chf: 0 }).success).toBe(false)
    expect(AppointmentActionSchema.safeParse({ action: 'quote', quoted_price_chf: 150 }).success).toBe(true)
  })

  it('start action accepts optional confirmed_date as ISO', () => {
    expect(AppointmentActionSchema.safeParse({ action: 'start' }).success).toBe(true)
    expect(AppointmentActionSchema.safeParse({ action: 'start', confirmed_date: ISO_DATE }).success).toBe(true)
    expect(AppointmentActionSchema.safeParse({ action: 'start', confirmed_date: '2026-06-15' }).success).toBe(false)
  })

  it('rate action requires customer_rating in [1,5]', () => {
    expect(AppointmentActionSchema.safeParse({ action: 'rate' }).success).toBe(false)
    expect(AppointmentActionSchema.safeParse({ action: 'rate', customer_rating: 0 }).success).toBe(false)
    expect(AppointmentActionSchema.safeParse({ action: 'rate', customer_rating: 6 }).success).toBe(false)
    expect(AppointmentActionSchema.safeParse({ action: 'rate', customer_rating: 3 }).success).toBe(true)
  })

  it('rejects an unknown action', () => {
    expect(AppointmentActionSchema.safeParse({ action: 'bogus' }).success).toBe(false)
  })
})

// ============================================================================
// PayAppointmentSchema
// ============================================================================

describe('PayAppointmentSchema', () => {
  it('applies all defaults on empty input', () => {
    const result = PayAppointmentSchema.safeParse({})
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.useEscrow).toBe(true)
    expect(result.data.autoReleaseDays).toBe(7)
    expect(result.data.paymentType).toBe('full')
  })

  it('accepts each paymentType', () => {
    for (const t of ['full', 'deposit', 'remaining']) {
      expect(PayAppointmentSchema.safeParse({ paymentType: t }).success).toBe(true)
    }
  })

  it('rejects unknown paymentType', () => {
    expect(PayAppointmentSchema.safeParse({ paymentType: 'tip' }).success).toBe(false)
  })

  it('accepts customAmount as either string or number', () => {
    expect(PayAppointmentSchema.safeParse({ customAmount: 50 }).success).toBe(true)
    expect(PayAppointmentSchema.safeParse({ customAmount: '50.00' }).success).toBe(true)
    expect(PayAppointmentSchema.safeParse({ customAmount: null }).success).toBe(true)
  })

  it('clamps autoReleaseDays to [1, 90]', () => {
    expect(PayAppointmentSchema.safeParse({ autoReleaseDays: 91 }).success).toBe(false)
    expect(PayAppointmentSchema.safeParse({ autoReleaseDays: 0 }).success).toBe(false)
    expect(PayAppointmentSchema.safeParse({ autoReleaseDays: 90 }).success).toBe(true)
  })
})
