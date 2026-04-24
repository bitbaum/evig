/**
 * Tests for location Zod schemas (lib/schemas/locations.ts)
 *
 * Locations represent physical spaces where workshops, repairs, and meetings
 * happen — core to the in-person mission of Revamp-IT. The cross-field
 * coordinate refinement (lat+lng must come together or not at all) is
 * mission-critical: a location with only one coordinate is unpinnable on a map.
 *
 * Covers: CreateLocationSchema (incl. lat/lng refinement),
 *         UpdateLocationSchema, ApproveLocationSchema,
 *         CreateLocationBookingSchema.
 */

import {
  CreateLocationSchema,
  UpdateLocationSchema,
  ApproveLocationSchema,
  CreateLocationBookingSchema,
} from '../locations'

// ============================================================================
// CreateLocationSchema
// ============================================================================

describe('CreateLocationSchema', () => {
  const valid = {
    name: 'Revamp-IT Werkstatt Zürich',
    type: 'workshop',
    city: 'Zürich',
  }

  it('accepts a minimal valid location', () => {
    const result = CreateLocationSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('defaults country to Switzerland', () => {
    const result = CreateLocationSchema.safeParse(valid)
    if (result.success) expect(result.data.country).toBe('Switzerland')
  })

  it('defaults facilities to []', () => {
    const result = CreateLocationSchema.safeParse(valid)
    if (result.success) expect(result.data.facilities).toEqual([])
  })

  it('rejects empty name', () => {
    const result = CreateLocationSchema.safeParse({ ...valid, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 200 characters', () => {
    const result = CreateLocationSchema.safeParse({ ...valid, name: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('rejects empty type', () => {
    const result = CreateLocationSchema.safeParse({ ...valid, type: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty city', () => {
    const result = CreateLocationSchema.safeParse({ ...valid, city: '' })
    expect(result.success).toBe(false)
  })

  it('rejects city longer than 200 characters', () => {
    const result = CreateLocationSchema.safeParse({ ...valid, city: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('accepts valid Swiss postal code', () => {
    const result = CreateLocationSchema.safeParse({ ...valid, postal_code: '8001' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid postal code', () => {
    const result = CreateLocationSchema.safeParse({ ...valid, postal_code: '800' })
    expect(result.success).toBe(false)
  })

  // Coordinate cross-field refinement
  it('accepts both latitude and longitude together', () => {
    const result = CreateLocationSchema.safeParse({
      ...valid,
      latitude: 47.3769,
      longitude: 8.5417,
    })
    expect(result.success).toBe(true)
  })

  it('accepts neither latitude nor longitude', () => {
    const result = CreateLocationSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects latitude without longitude', () => {
    const result = CreateLocationSchema.safeParse({ ...valid, latitude: 47.3769 })
    expect(result.success).toBe(false)
  })

  it('rejects longitude without latitude', () => {
    const result = CreateLocationSchema.safeParse({ ...valid, longitude: 8.5417 })
    expect(result.success).toBe(false)
  })

  it('rejects latitude out of range', () => {
    const result = CreateLocationSchema.safeParse({ ...valid, latitude: 91, longitude: 8.5 })
    expect(result.success).toBe(false)
  })

  it('rejects longitude out of range', () => {
    const result = CreateLocationSchema.safeParse({ ...valid, latitude: 47.0, longitude: 181 })
    expect(result.success).toBe(false)
  })

  it('rejects negative max_capacity', () => {
    const result = CreateLocationSchema.safeParse({ ...valid, max_capacity: 0 })
    expect(result.success).toBe(false)
  })

  it('accepts positive max_capacity', () => {
    const result = CreateLocationSchema.safeParse({ ...valid, max_capacity: 20 })
    expect(result.success).toBe(true)
  })

  it('accepts valid contact_email', () => {
    const result = CreateLocationSchema.safeParse({
      ...valid,
      contact_email: 'werkstatt@revamp-it.ch',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid contact_email', () => {
    const result = CreateLocationSchema.safeParse({ ...valid, contact_email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('accepts facilities array', () => {
    const result = CreateLocationSchema.safeParse({
      ...valid,
      facilities: ['WiFi', 'Behindertengerecht', 'Parkplätze'],
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// UpdateLocationSchema
// ============================================================================

describe('UpdateLocationSchema', () => {
  it('accepts empty update (all optional)', () => {
    const result = UpdateLocationSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts partial update with one field', () => {
    const result = UpdateLocationSchema.safeParse({ city: 'Basel' })
    expect(result.success).toBe(true)
  })

  it('still validates email if provided', () => {
    const result = UpdateLocationSchema.safeParse({ contact_email: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('accepts accessibility_info record', () => {
    const result = UpdateLocationSchema.safeParse({
      accessibility_info: { wheelchair: true, elevator: false },
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// ApproveLocationSchema
// ============================================================================

describe('ApproveLocationSchema', () => {
  it('accepts approve', () => {
    const result = ApproveLocationSchema.safeParse({ action: 'approve' })
    expect(result.success).toBe(true)
  })

  it('accepts reject', () => {
    const result = ApproveLocationSchema.safeParse({ action: 'reject' })
    expect(result.success).toBe(true)
  })

  it('accepts suspend', () => {
    const result = ApproveLocationSchema.safeParse({ action: 'suspend' })
    expect(result.success).toBe(true)
  })

  it('accepts reinstate', () => {
    const result = ApproveLocationSchema.safeParse({ action: 'reinstate' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid action', () => {
    const result = ApproveLocationSchema.safeParse({ action: 'delete' })
    expect(result.success).toBe(false)
  })

  it('rejects missing action', () => {
    const result = ApproveLocationSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('defaults required_changes to []', () => {
    const result = ApproveLocationSchema.safeParse({ action: 'reject' })
    if (result.success) expect(result.data.required_changes).toEqual([])
  })

  it('accepts review_notes', () => {
    const result = ApproveLocationSchema.safeParse({
      action: 'reject',
      review_notes: 'Adresse fehlt.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects review_notes longer than 5000 characters', () => {
    const result = ApproveLocationSchema.safeParse({
      action: 'approve',
      review_notes: 'x'.repeat(5001),
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// CreateLocationBookingSchema
// ============================================================================

describe('CreateLocationBookingSchema', () => {
  const valid = {
    event_type: 'workshop',
    title: 'Linux-Workshop für Einsteiger',
    start_time: '2026-05-15T09:00:00Z',
    end_time: '2026-05-15T12:00:00Z',
  }

  it('accepts a valid booking', () => {
    const result = CreateLocationBookingSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts all valid event_types', () => {
    for (const event_type of ['workshop', 'repair', 'meeting', 'other']) {
      const result = CreateLocationBookingSchema.safeParse({ ...valid, event_type })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid event_type', () => {
    const result = CreateLocationBookingSchema.safeParse({ ...valid, event_type: 'party' })
    expect(result.success).toBe(false)
  })

  it('rejects empty title', () => {
    const result = CreateLocationBookingSchema.safeParse({ ...valid, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects title longer than 300 characters', () => {
    const result = CreateLocationBookingSchema.safeParse({ ...valid, title: 'x'.repeat(301) })
    expect(result.success).toBe(false)
  })

  it('rejects empty start_time', () => {
    const result = CreateLocationBookingSchema.safeParse({ ...valid, start_time: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty end_time', () => {
    const result = CreateLocationBookingSchema.safeParse({ ...valid, end_time: '' })
    expect(result.success).toBe(false)
  })

  it('rejects negative expected_attendees', () => {
    const result = CreateLocationBookingSchema.safeParse({ ...valid, expected_attendees: 0 })
    expect(result.success).toBe(false)
  })

  it('accepts positive expected_attendees', () => {
    const result = CreateLocationBookingSchema.safeParse({ ...valid, expected_attendees: 15 })
    expect(result.success).toBe(true)
  })

  it('accepts valid UUID event_id', () => {
    const result = CreateLocationBookingSchema.safeParse({
      ...valid,
      event_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-UUID event_id', () => {
    const result = CreateLocationBookingSchema.safeParse({ ...valid, event_id: 'not-uuid' })
    expect(result.success).toBe(false)
  })
})
