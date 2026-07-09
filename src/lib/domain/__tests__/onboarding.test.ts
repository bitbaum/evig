import { isBasicProfileComplete, isScheduleSet, isTeamProfileComplete } from '@/lib/domain/onboarding'

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

describe('isScheduleSet (staff)', () => {
  it('true only when working_hours has content', () => {
    expect(isScheduleSet({ working_hours: null, skills: null, goals: null })).toBe(false)
    expect(isScheduleSet({ working_hours: '   ', skills: null, goals: null })).toBe(false)
    expect(isScheduleSet({ working_hours: '{"version":1}', skills: null, goals: null })).toBe(true)
  })
})

describe('isTeamProfileComplete (staff)', () => {
  it('needs both skills and goals', () => {
    expect(isTeamProfileComplete({ working_hours: null, skills: [], goals: 'wachsen' })).toBe(false)
    expect(isTeamProfileComplete({ working_hours: null, skills: ['löten'], goals: null })).toBe(false)
    expect(isTeamProfileComplete({ working_hours: null, skills: ['löten'], goals: '  ' })).toBe(false)
    expect(isTeamProfileComplete({ working_hours: null, skills: ['löten'], goals: 'wachsen' })).toBe(true)
  })
})
