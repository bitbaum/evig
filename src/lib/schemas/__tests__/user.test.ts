/**
 * Tests for user profile Zod schemas (lib/schemas/user.ts)
 *
 * The user profile schema drives the public-facing profile editor for all
 * Revamp-IT users (customers, sellers, repairers). Validation here controls
 * what reaches the user record in the database.
 *
 * Covers: UpdateProfileSchema — display_name, bio, avatar_url, postal code,
 *         profile_visibility, service_radius_km, availability structure.
 */

import { UpdateProfileSchema } from '../user'

describe('UpdateProfileSchema', () => {
  it('accepts empty update (all optional)', () => {
    const result = UpdateProfileSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts a full valid profile update', () => {
    const result = UpdateProfileSchema.safeParse({
      first_name: 'Max',
      last_name: 'Muster',
      display_name: 'MaxM',
      bio: 'Linux-Enthusiast aus Zürich.',
      profile_visibility: 'public',
    })
    expect(result.success).toBe(true)
  })

  // display_name
  it('rejects display_name shorter than 2 characters', () => {
    const result = UpdateProfileSchema.safeParse({ display_name: 'X' })
    expect(result.success).toBe(false)
  })

  it('rejects display_name longer than 50 characters', () => {
    const result = UpdateProfileSchema.safeParse({ display_name: 'x'.repeat(51) })
    expect(result.success).toBe(false)
  })

  it('accepts display_name of exactly 2 characters', () => {
    const result = UpdateProfileSchema.safeParse({ display_name: 'MX' })
    expect(result.success).toBe(true)
  })

  // bio
  it('rejects bio longer than 500 characters', () => {
    const result = UpdateProfileSchema.safeParse({ bio: 'x'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('accepts bio of exactly 500 characters', () => {
    const result = UpdateProfileSchema.safeParse({ bio: 'x'.repeat(500) })
    expect(result.success).toBe(true)
  })

  // profile_visibility
  it('accepts profile_visibility "public" and "private"', () => {
    for (const profile_visibility of ['public', 'private']) {
      const result = UpdateProfileSchema.safeParse({ profile_visibility })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid profile_visibility', () => {
    const result = UpdateProfileSchema.safeParse({ profile_visibility: 'team' })
    expect(result.success).toBe(false)
  })

  // avatar_url
  it('accepts valid avatar URL', () => {
    const result = UpdateProfileSchema.safeParse({ avatar_url: 'https://example.com/photo.jpg' })
    expect(result.success).toBe(true)
  })

  it('accepts empty string avatar_url (clears avatar)', () => {
    const result = UpdateProfileSchema.safeParse({ avatar_url: '' })
    expect(result.success).toBe(true)
  })

  it('rejects non-URL avatar_url that is not empty string', () => {
    const result = UpdateProfileSchema.safeParse({ avatar_url: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  // website
  it('accepts valid website URL', () => {
    const result = UpdateProfileSchema.safeParse({ website: 'https://revamp-it.ch' })
    expect(result.success).toBe(true)
  })

  it('accepts empty string website', () => {
    const result = UpdateProfileSchema.safeParse({ website: '' })
    expect(result.success).toBe(true)
  })

  it('rejects non-URL website', () => {
    const result = UpdateProfileSchema.safeParse({ website: 'revamp-it' })
    expect(result.success).toBe(false)
  })

  // postal_code
  it('accepts valid 4-digit Swiss postal code', () => {
    const result = UpdateProfileSchema.safeParse({ postal_code: '8001' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid postal code', () => {
    const result = UpdateProfileSchema.safeParse({ postal_code: '800' })
    expect(result.success).toBe(false)
  })

  // service_radius_km
  it('accepts service_radius_km of 0', () => {
    const result = UpdateProfileSchema.safeParse({ service_radius_km: 0 })
    expect(result.success).toBe(true)
  })

  it('rejects negative service_radius_km', () => {
    const result = UpdateProfileSchema.safeParse({ service_radius_km: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer service_radius_km', () => {
    const result = UpdateProfileSchema.safeParse({ service_radius_km: 12.5 })
    expect(result.success).toBe(false)
  })

  // booleans
  it('accepts boolean notification preferences', () => {
    const result = UpdateProfileSchema.safeParse({
      email_notifications: true,
      sms_notifications: false,
      marketplace_updates: true,
      workshop_reminders: false,
    })
    expect(result.success).toBe(true)
  })

  // name length limits
  it('rejects first_name longer than 100 characters', () => {
    const result = UpdateProfileSchema.safeParse({ first_name: 'x'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('rejects company_name longer than 200 characters', () => {
    const result = UpdateProfileSchema.safeParse({ company_name: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  // availability structure
  it('accepts valid availability record', () => {
    const result = UpdateProfileSchema.safeParse({
      availability: {
        monday: { available: true, hours: '09:00-17:00' },
        tuesday: { available: false },
      },
    })
    expect(result.success).toBe(true)
  })
})
