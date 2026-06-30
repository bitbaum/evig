/** Regression: GET /api/user/profile returns null for empty columns; saving must
 *  not 400 ("Validierungsfehler") on those nulls. */
import { UpdateProfileSchema } from '../user'

describe('UpdateProfileSchema — null fields (empty profile save)', () => {
  it('accepts the null-heavy payload a sparse profile sends back', () => {
    const r = UpdateProfileSchema.safeParse({
      first_name: null, last_name: null, company_name: null, avatar_url: null,
      display_name: null, bio: null, phone: null, mobile: null,
      address_line1: null, address_line2: null, postal_code: null, city: null,
      canton: null, country: null, interests: null, website: null,
      skills: null, expertise_areas: null, service_radius_km: null, availability: null,
      profile_visibility: null, show_email: null, newsletter_subscribed: null,
    })
    expect(r.success).toBe(true)
  })
  it('still accepts a normal filled payload', () => {
    const r = UpdateProfileSchema.safeParse({
      first_name: 'Georgy', bio: 'Hi', website: 'https://revamp-it.ch',
      service_radius_km: 50, skills: ['linux'], profile_visibility: 'public',
    })
    expect(r.success).toBe(true)
  })
  it('still rejects a genuinely invalid website', () => {
    const r = UpdateProfileSchema.safeParse({ website: 'not-a-url' })
    expect(r.success).toBe(false)
  })
})
