import { isBasicProfileComplete } from '@/lib/domain/onboarding'

describe('isBasicProfileComplete', () => {
  it('returns false when first or last name is missing', () => {
    expect(isBasicProfileComplete({ first_name: null, last_name: 'Muster' })).toBe(false)
    expect(isBasicProfileComplete({ first_name: 'Max', last_name: null })).toBe(false)
    expect(isBasicProfileComplete({ first_name: '', last_name: '' })).toBe(false)
  })

  it('returns false when names are too short', () => {
    expect(isBasicProfileComplete({ first_name: 'M', last_name: 'Muster' })).toBe(false)
  })

  it('returns true when both names meet minimum length', () => {
    expect(isBasicProfileComplete({ first_name: 'Max', last_name: 'Muster' })).toBe(true)
    expect(isBasicProfileComplete({ first_name: '  Anna  ', last_name: 'Meier  ' })).toBe(true)
  })
})
