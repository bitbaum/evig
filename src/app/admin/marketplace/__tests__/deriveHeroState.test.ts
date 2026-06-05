/**
 * Marketplace hero-state derivation tests.
 * Severity ladder: openReports > unverified > healthy.
 */

import type { Stats } from '../types'
import { __test__deriveHeroState } from '../MarketplaceAdminClient'

function makeStats(overrides: Partial<Stats> = {}): Stats {
  return {
    total: 50,
    byStatus: { active: 30 },
    unverified: 0,
    verified: 30,
    openReports: 0,
    revampit: 5,
    ...overrides,
  }
}

const onJump = jest.fn()
beforeEach(() => jest.clearAllMocks())

describe('Marketplace deriveHeroState', () => {
  it('URGENT wins when openReports > 0 (even if unverified also > 0)', () => {
    const s = __test__deriveHeroState(
      makeStats({ openReports: 2, unverified: 4 }),
      onJump,
    )
    expect(s.tone).toBe('urgent')
    expect(s.headline).toContain('2 offene Meldung')
    expect(s.cta?.label).toBe('Meldungen ansehen')
  })

  it('ATTENTION when openReports === 0 + unverified > 0', () => {
    const s = __test__deriveHeroState(
      makeStats({ unverified: 7 }),
      onJump,
    )
    expect(s.tone).toBe('attention')
    expect(s.headline).toContain('7 ungeprüfte')
    expect(s.cta?.label).toBe('Inserate prüfen')
  })

  it('HEALTHY when all clear', () => {
    const s = __test__deriveHeroState(makeStats(), onJump)
    expect(s.tone).toBe('healthy')
    expect(s.headline).toMatch(/grünen Bereich/)
    expect(s.cta).toBeUndefined()
  })

  it('pluralizes "Meldung" correctly', () => {
    const singular = __test__deriveHeroState(
      makeStats({ openReports: 1 }),
      onJump,
    )
    expect(singular.headline).toContain('1 offene Meldung prüfen')

    const plural = __test__deriveHeroState(
      makeStats({ openReports: 3 }),
      onJump,
    )
    expect(plural.headline).toContain('3 offene Meldungen prüfen')
  })

  it('kpis always have the same 4 labels in order', () => {
    const s = __test__deriveHeroState(makeStats(), onJump)
    expect(s.kpis.map((k) => k.label)).toEqual([
      'Aktiv',
      'Ungeprüft',
      'Offene Meldungen',
      'RevampIT-Inserate',
    ])
  })

  it('onClick CTA jumps to the right tab', () => {
    const s = __test__deriveHeroState(
      makeStats({ openReports: 1 }),
      onJump,
    )
    if (s.cta && 'onClick' in s.cta) s.cta.onClick()
    expect(onJump).toHaveBeenCalledWith('reports')
  })

  it('unverified jumps to listings tab', () => {
    const s = __test__deriveHeroState(
      makeStats({ unverified: 1 }),
      onJump,
    )
    if (s.cta && 'onClick' in s.cta) s.cta.onClick()
    expect(onJump).toHaveBeenCalledWith('listings')
  })
})
