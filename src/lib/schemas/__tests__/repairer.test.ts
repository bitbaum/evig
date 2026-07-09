/**
 * Tests for repairer Zod schemas (lib/schemas/repairer.ts)
 *
 * Repairers (technicians) are the supply side of IT-Hilfe — matching them
 * to repair requests is the core mission flow. The application schema ensures
 * only well-formed profiles enter the verification pipeline.
 *
 * Covers: TechnicianProfileSchema.
 */

import {
  TechnicianProfileSchema,
} from '../repairer'

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
