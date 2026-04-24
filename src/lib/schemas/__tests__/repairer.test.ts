/**
 * Tests for repairer Zod schemas (lib/schemas/repairer.ts)
 *
 * Repairers (technicians) are the supply side of IT-Hilfe — matching them
 * to repair requests is the core mission flow. The application schema ensures
 * only well-formed profiles enter the verification pipeline.
 *
 * Covers: RepairerApplicationSchema, TechnicianProfileSchema.
 */

import {
  RepairerApplicationSchema,
  TechnicianProfileSchema,
} from '../repairer'

// ============================================================================
// RepairerApplicationSchema
// ============================================================================

describe('RepairerApplicationSchema', () => {
  const valid = {
    businessType: 'freelancer',
    description: 'Erfahrener Linux-Techniker mit 10 Jahren Erfahrung.',
    phone: '+41791234567',
    address: 'Musterstrasse 1',
    city: 'Zürich',
    postalCode: '8001',
    servicesOffered: ['linux', 'windows'],
    termsAccepted: true as const,
  }

  it('accepts a minimal valid application', () => {
    const result = RepairerApplicationSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('defaults yearsExperience to 0', () => {
    const result = RepairerApplicationSchema.safeParse(valid)
    if (result.success) expect(result.data.yearsExperience).toBe(0)
  })

  it('defaults serviceRadius to 30', () => {
    const result = RepairerApplicationSchema.safeParse(valid)
    if (result.success) expect(result.data.serviceRadius).toBe(30)
  })

  it('defaults remoteServices to false', () => {
    const result = RepairerApplicationSchema.safeParse(valid)
    if (result.success) expect(result.data.remoteServices).toBe(false)
  })

  it('defaults specializations to []', () => {
    const result = RepairerApplicationSchema.safeParse(valid)
    if (result.success) expect(result.data.specializations).toEqual([])
  })

  it('defaults certifications to []', () => {
    const result = RepairerApplicationSchema.safeParse(valid)
    if (result.success) expect(result.data.certifications).toEqual([])
  })

  it('rejects empty businessType', () => {
    const result = RepairerApplicationSchema.safeParse({ ...valid, businessType: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty description', () => {
    const result = RepairerApplicationSchema.safeParse({ ...valid, description: '' })
    expect(result.success).toBe(false)
  })

  it('rejects phone shorter than 10 characters', () => {
    const result = RepairerApplicationSchema.safeParse({ ...valid, phone: '079123' })
    expect(result.success).toBe(false)
  })

  it('rejects empty address', () => {
    const result = RepairerApplicationSchema.safeParse({ ...valid, address: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty city', () => {
    const result = RepairerApplicationSchema.safeParse({ ...valid, city: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid postal code', () => {
    const result = RepairerApplicationSchema.safeParse({ ...valid, postalCode: '800' })
    expect(result.success).toBe(false)
  })

  it('rejects empty servicesOffered array', () => {
    const result = RepairerApplicationSchema.safeParse({ ...valid, servicesOffered: [] })
    expect(result.success).toBe(false)
  })

  it('rejects termsAccepted: false', () => {
    const result = RepairerApplicationSchema.safeParse({ ...valid, termsAccepted: false })
    expect(result.success).toBe(false)
  })

  it('rejects missing termsAccepted', () => {
    const { termsAccepted, ...rest } = valid
    const result = RepairerApplicationSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('accepts valid website URL', () => {
    const result = RepairerApplicationSchema.safeParse({
      ...valid,
      website: 'https://example.com',
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty string website (optional)', () => {
    const result = RepairerApplicationSchema.safeParse({ ...valid, website: '' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid website that is not empty', () => {
    const result = RepairerApplicationSchema.safeParse({ ...valid, website: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('coerces string yearsExperience to integer', () => {
    const result = RepairerApplicationSchema.safeParse({ ...valid, yearsExperience: '5' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.yearsExperience).toBe(5)
  })

  it('rejects negative yearsExperience', () => {
    const result = RepairerApplicationSchema.safeParse({ ...valid, yearsExperience: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects negative hourlyRate', () => {
    const result = RepairerApplicationSchema.safeParse({ ...valid, hourlyRate: 0 })
    expect(result.success).toBe(false)
  })

  it('accepts positive hourlyRate', () => {
    const result = RepairerApplicationSchema.safeParse({ ...valid, hourlyRate: 80 })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// TechnicianProfileSchema
// ============================================================================

describe('TechnicianProfileSchema', () => {
  it('accepts empty object (all defaults)', () => {
    const result = TechnicianProfileSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('defaults skills to []', () => {
    const result = TechnicianProfileSchema.safeParse({})
    if (result.success) expect(result.data.skills).toEqual([])
  })

  it('defaults bio to empty string', () => {
    const result = TechnicianProfileSchema.safeParse({})
    if (result.success) expect(result.data.bio).toBe('')
  })

  it('defaults hourlyRateCents to null', () => {
    const result = TechnicianProfileSchema.safeParse({})
    if (result.success) expect(result.data.hourlyRateCents).toBeNull()
  })

  it('defaults acceptsGratis to true', () => {
    const result = TechnicianProfileSchema.safeParse({})
    if (result.success) expect(result.data.acceptsGratis).toBe(true)
  })

  it('defaults acceptsKulturlegi to true', () => {
    const result = TechnicianProfileSchema.safeParse({})
    if (result.success) expect(result.data.acceptsKulturlegi).toBe(true)
  })

  it('defaults serviceTypes to ["flexible"]', () => {
    const result = TechnicianProfileSchema.safeParse({})
    if (result.success) expect(result.data.serviceTypes).toEqual(['flexible'])
  })

  it('defaults maxTravelKm to 10', () => {
    const result = TechnicianProfileSchema.safeParse({})
    if (result.success) expect(result.data.maxTravelKm).toBe(10)
  })

  it('defaults isActive to false', () => {
    const result = TechnicianProfileSchema.safeParse({})
    if (result.success) expect(result.data.isActive).toBe(false)
  })

  it('accepts all valid service types', () => {
    const result = TechnicianProfileSchema.safeParse({
      serviceTypes: ['remote', 'onsite', 'pickup', 'dropoff', 'flexible'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid service type', () => {
    const result = TechnicianProfileSchema.safeParse({ serviceTypes: ['carrier_pigeon'] })
    expect(result.success).toBe(false)
  })

  it('rejects hourlyRateCents below 0', () => {
    const result = TechnicianProfileSchema.safeParse({ hourlyRateCents: -1 })
    expect(result.success).toBe(false)
  })

  it('accepts hourlyRateCents of 0 (gratis)', () => {
    const result = TechnicianProfileSchema.safeParse({ hourlyRateCents: 0 })
    expect(result.success).toBe(true)
  })

  it('rejects maxTravelKm above 500', () => {
    const result = TechnicianProfileSchema.safeParse({ maxTravelKm: 501 })
    expect(result.success).toBe(false)
  })

  it('accepts maxTravelKm of 0 (local only)', () => {
    const result = TechnicianProfileSchema.safeParse({ maxTravelKm: 0 })
    expect(result.success).toBe(true)
  })

  it('rejects bio longer than 5000 characters', () => {
    const result = TechnicianProfileSchema.safeParse({ bio: 'x'.repeat(5001) })
    expect(result.success).toBe(false)
  })

  it('rejects canton longer than 2 characters', () => {
    const result = TechnicianProfileSchema.safeParse({ canton: 'ZUR' })
    expect(result.success).toBe(false)
  })

  it('accepts canton of 2 characters', () => {
    const result = TechnicianProfileSchema.safeParse({ canton: 'ZH' })
    expect(result.success).toBe(true)
  })
})
